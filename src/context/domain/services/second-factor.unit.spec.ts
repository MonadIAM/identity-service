import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { SecondFactorUnitHelpers } from "~testing/unit/domain-service/second-factor.helpers";
import { SecondFactorType } from "~context/enums";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID       = "00000000-0000-4000-8000-c00000000001";
const FACTOR_ID        = "00000000-0000-4000-8000-c00000000002";
const SECOND_FACTOR_ID = "00000000-0000-4000-8000-c00000000003";
/* eslint-enable prettier/prettier */

const IDENTITY = "user@example.com";
const MASTER_CODE_HASH = "master-code-hash";

const helpers = new SecondFactorUnitHelpers();

function createConfirmedFactor(props: Partial<Entities.SecondFactor.Contract> = {}): Entities.SecondFactor {
    return helpers.createSecondFactor({ id: FACTOR_ID, confirmedAt: new Date(), ...props });
}

describe("[DomainService] - SecondFactor", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when a factor of the same type already exists", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createSecondFactor({ account })),
            );

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                input: {
                    type: SecondFactorType.TOTP,
                    name: "Authenticator",
                    secret: "enc-secret",
                    account: ACCOUNT_ID,
                },
            });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.TOTP_FACTOR_EXISTS");
            expect(repositories.secondFactors.findUnique).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, type: SecondFactorType.TOTP },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates and persists the factor when the account has none of that type", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    type: SecondFactorType.TOTP,
                    name: "Authenticator",
                    secret: "enc-secret",
                    account: ACCOUNT_ID,
                },
            });

            // Assert
            expect(result).toEqual(
                expect.objectContaining({
                    type: SecondFactorType.TOTP,
                    name: "Authenticator",
                    secret: "enc-secret",
                    account,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - accepts the code and confirms the factor", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            const acceptSpy = jest.spyOn(service, "acceptCode");
            const confirmSpy = jest.spyOn(factor, "confirm");
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            // Act
            const result = await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            // Assert
            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy.mock.calls[0][0].input.factor).toBe(factor);
            expect(acceptSpy.mock.calls[0][0].input.code).toBe("123456");
            expect(confirmSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(factor);
        });

        it("[case] - bootstraps a master code when the account has none", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            // Act
            await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            // Assert
            expect(transaction.persist).toHaveBeenCalledWith(expect.objectContaining({ hash: MASTER_CODE_HASH, account }));
        });

        it("[case] - does not persist a second master code when one already exists", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            account.masterCode = helpers.createMasterCode({ account });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            // Act
            await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            // Assert
            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - authenticate", () => {
        it("[case] - accepts the code of a confirmed factor and returns it", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, repositories, transaction } = helpers.service();
            const acceptSpy = jest.spyOn(service, "acceptCode");
            repositories.secondFactors.findUnique.mockImplementation(() => Promise.resolve(factor));

            // Act
            const result = await service.authenticate({
                input: { account: ACCOUNT_ID, code: "123456" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.secondFactors.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { confirmedAt: { $ne: null }, account: ACCOUNT_ID },
                }),
            );
            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy.mock.calls[0][0].input.factor).toBe(factor);
            expect(acceptSpy.mock.calls[0][0].input.code).toBe("123456");
            expect(result).toBe(factor);
        });

        it("[case] - throws unauthorized when the account has no confirmed factor", async () => {
            // Arrange
            const { service, transaction } = helpers.service();

            // Act
            const result = service.authenticate({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID, code: "123456" },
            });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
        });
    });

    describe("[Method] - reauthenticate", () => {
        it("[case] - accepts the code of any confirmed factor of the account", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, repositories, transaction } = helpers.service();
            const acceptSpy = jest.spyOn(service, "acceptCode");
            repositories.secondFactors.findUnique.mockImplementation(() => Promise.resolve(factor));

            // Act
            const result = await service.reauthenticate({
                input: { account: ACCOUNT_ID, code: "123456" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.secondFactors.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { confirmedAt: { $ne: null }, account: ACCOUNT_ID },
                }),
            );
            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy.mock.calls[0][0].input.factor).toBe(factor);
            expect(acceptSpy.mock.calls[0][0].input.code).toBe("123456");
            expect(result).toBe(factor);
        });

        it("[case] - throws bad request when the account has no confirmed factor", async () => {
            // Arrange
            const { service, transaction } = helpers.service();

            // Act
            const result = service.reauthenticate({
                input: { account: ACCOUNT_ID, code: "123456" },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - keeps the master code while another confirmed factor remains", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const masterCode = helpers.createMasterCode({ account });
            account.masterCode = masterCode;
            const target = createConfirmedFactor({ account });
            const remaining = createConfirmedFactor({ id: SECOND_FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.find.mockImplementation(() => Promise.resolve([target, remaining]));

            // Act
            await service.purge({
                input: { account: ACCOUNT_ID, target: FACTOR_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(transaction.remove).toHaveBeenCalledWith(target);
            expect(transaction.remove).not.toHaveBeenCalledWith(masterCode);
        });

        it("[case] - removes the master code when no confirmed factor is left", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const masterCode = helpers.createMasterCode({ account });
            account.masterCode = masterCode;
            const target = createConfirmedFactor({ account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.find.mockImplementation(() => Promise.resolve([target]));

            // Act
            await service.purge({
                input: { account: ACCOUNT_ID, target: FACTOR_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(transaction.remove).toHaveBeenNthCalledWith(1, target);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, masterCode);
        });
    });

    describe("[Method] - reset", () => {
        it("[case] - throws when the identifier or its account master code is missing", async () => {
            // Arrange
            const { service, transaction } = helpers.service();

            // Act
            const result = service.reset({
                input: { identifier: IDENTITY, code: "master-code" },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_CODE");
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("[case] - throws when the master code does not match", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            account.masterCode = helpers.createMasterCode({ account });
            account.secondFactors = helpers.collection({ owner: account, items: [] });
            const { service, repositories, services, transaction } = helpers.service({ account });
            services.hashing.verify.mockImplementation(() => Promise.resolve(false));
            repositories.identifiers.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            // Act
            const result = service.reset({
                input: { identifier: IDENTITY, code: "wrong-code" },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_CODE");
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("[case] - removes every factor and the master code for a valid code", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const masterCode = helpers.createMasterCode({ account });
            account.masterCode = masterCode;
            const first = createConfirmedFactor({ account });
            const second = createConfirmedFactor({ id: SECOND_FACTOR_ID, account });
            account.secondFactors = helpers.collection({ owner: account, items: [first, second] });
            const { service, repositories, services, transaction } = helpers.service({ account });
            repositories.identifiers.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            // Act
            const result = await service.reset({
                input: { identifier: IDENTITY, code: "master-code" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(services.hashing.verify).toHaveBeenCalledWith({
                storedHash: masterCode.hash,
                value: "master-code",
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, first);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, second);
            expect(transaction.remove).toHaveBeenNthCalledWith(3, masterCode);
            expect(result).toBe(account);
        });
    });

    describe("[Method] - acceptCode", () => {
        it("[case] - throws when the totp service rejects the code", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const acceptTOTPSpy = jest.spyOn(factor, "acceptTOTP");
            services.totp.verify.mockImplementation(() => null);

            // Act
            const result = service.acceptCode({ input: { factor, code: "000000" } });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_TOTP_CODE");
            expect(acceptTOTPSpy).not.toHaveBeenCalled();
        });

        it("[case] - throws when the entity rejects a replayed step", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            jest.spyOn(factor, "acceptTOTP").mockImplementation(() => false);
            services.totp.verify.mockImplementation(() => ({ step: 42 }));

            // Act
            const result = service.acceptCode({ input: { factor, code: "123456" } });

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_TOTP_CODE");
        });

        it("[case] - accepts the verified step on the factor", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const acceptTOTPSpy = jest.spyOn(factor, "acceptTOTP");
            services.totp.verify.mockImplementation(() => ({ step: 42 }));
            services.secondFactorSecret.resolve.mockImplementation(() => Promise.resolve({ plaintext: "plain-secret" }));

            // Act
            await service.acceptCode({ input: { factor, code: "123456" } });

            // Assert
            expect(services.secondFactorSecret.resolve).toHaveBeenCalledWith({ secret: factor.secret });
            expect(services.totp.verify).toHaveBeenCalledWith({ secret: "plain-secret", code: "123456" });
            expect(acceptTOTPSpy).toHaveBeenCalledWith(42);
        });

        it("[case] - rewraps the secret when the secret service returned a fresh ciphertext", async () => {
            // Arrange
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const rewrapSpy = jest.spyOn(factor, "rewrap");
            services.totp.verify.mockImplementation(() => ({ step: 42 }));
            services.secondFactorSecret.resolve.mockImplementation(() =>
                Promise.resolve({ plaintext: "plain-secret", ciphertext: "rewrapped-secret" }),
            );

            // Act
            await service.acceptCode({ input: { factor, code: "123456" } });

            // Assert
            expect(rewrapSpy).toHaveBeenCalledWith("rewrapped-secret");
        });
    });
});
