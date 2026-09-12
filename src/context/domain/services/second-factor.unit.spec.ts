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

describe("SecondFactorService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when a factor of the same type already exists", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createSecondFactor({ account })),
            );

            await expect(
                service.create({
                    transaction: transaction.entityManager,
                    input: {
                        type: SecondFactorType.TOTP,
                        name: "Authenticator",
                        secret: "enc-secret",
                        account: ACCOUNT_ID,
                    },
                }),
            ).rejects.toThrow("services.second-factor.TOTP_FACTOR_EXISTS");

            expect(repositories.secondFactors.findUnique).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, type: SecondFactorType.TOTP },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates and persists the factor when the account has none of that type", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });

            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    type: SecondFactorType.TOTP,
                    name: "Authenticator",
                    secret: "enc-secret",
                    account: ACCOUNT_ID,
                },
            });

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

    describe("verify", () => {
        it("accepts the code and confirms the factor", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            const acceptSpy = jest.spyOn(service, "acceptCode");
            const confirmSpy = jest.spyOn(factor, "confirm");
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            const result = await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy.mock.calls[0][0].input.factor).toBe(factor);
            expect(acceptSpy.mock.calls[0][0].input.code).toBe("123456");
            expect(confirmSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(factor);
        });

        it("bootstraps a master code when the account has none", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            expect(transaction.persist).toHaveBeenCalledWith(expect.objectContaining({ hash: MASTER_CODE_HASH, account }));
        });

        it("does not persist a second master code when one already exists", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            account.masterCode = helpers.createMasterCode({ account });
            const factor = helpers.createSecondFactor({ id: FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.findUniqueOrThrow.mockImplementation(() => Promise.resolve(factor));

            await service.verify({
                transaction: transaction.entityManager,
                input: {
                    masterCodeHash: MASTER_CODE_HASH,
                    account: ACCOUNT_ID,
                    factor: FACTOR_ID,
                    code: "123456",
                },
            });

            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("authenticate", () => {
        it("accepts the code of a confirmed factor and returns it", async () => {
            const factor = createConfirmedFactor();
            const { service, repositories, transaction } = helpers.service();
            const acceptSpy = jest.spyOn(service, "acceptCode");
            repositories.secondFactors.findUnique.mockImplementation(() => Promise.resolve(factor));

            const result = await service.authenticate({
                input: { factor: FACTOR_ID, account: ACCOUNT_ID, code: "123456" },
                transaction: transaction.entityManager,
            });

            expect(repositories.secondFactors.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { confirmedAt: { $ne: null }, account: ACCOUNT_ID, id: FACTOR_ID },
                }),
            );
            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy.mock.calls[0][0].input.factor).toBe(factor);
            expect(acceptSpy.mock.calls[0][0].input.code).toBe("123456");
            expect(result).toBe(factor);
        });

        it("throws unauthorized when the account has no confirmed factor", async () => {
            const { service, transaction } = helpers.service();

            await expect(
                service.authenticate({
                    transaction: transaction.entityManager,
                    input: { factor: FACTOR_ID, account: ACCOUNT_ID, code: "123456" },
                }),
            ).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
        });
    });

    describe("reauthenticate", () => {
        it("accepts the code of any confirmed factor of the account", async () => {
            const factor = createConfirmedFactor();
            const { service, repositories, transaction } = helpers.service();
            const acceptSpy = jest.spyOn(service, "acceptCode");
            repositories.secondFactors.findUnique.mockImplementation(() => Promise.resolve(factor));

            const result = await service.reauthenticate({
                input: { account: ACCOUNT_ID, code: "123456" },
                transaction: transaction.entityManager,
            });

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

        it("throws bad request when the account has no confirmed factor", async () => {
            const { service, transaction } = helpers.service();

            await expect(
                service.reauthenticate({
                    input: { account: ACCOUNT_ID, code: "123456" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
        });
    });

    describe("purge", () => {
        it("keeps the master code while another confirmed factor remains", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const masterCode = helpers.createMasterCode({ account });
            account.masterCode = masterCode;
            const target = createConfirmedFactor({ account });
            const remaining = createConfirmedFactor({ id: SECOND_FACTOR_ID, account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.find.mockImplementation(() => Promise.resolve([target, remaining]));

            await service.purge({
                input: { account: ACCOUNT_ID, target: FACTOR_ID },
                transaction: transaction.entityManager,
            });

            expect(transaction.remove).toHaveBeenCalledWith(target);
            expect(transaction.remove).not.toHaveBeenCalledWith(masterCode);
        });

        it("removes the master code when no confirmed factor is left", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const masterCode = helpers.createMasterCode({ account });
            account.masterCode = masterCode;
            const target = createConfirmedFactor({ account });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.secondFactors.find.mockImplementation(() => Promise.resolve([target]));

            await service.purge({
                input: { account: ACCOUNT_ID, target: FACTOR_ID },
                transaction: transaction.entityManager,
            });

            expect(transaction.remove).toHaveBeenNthCalledWith(1, target);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, masterCode);
        });
    });

    describe("reset", () => {
        it("throws when the identifier or its account master code is missing", async () => {
            const { service, transaction } = helpers.service();

            await expect(
                service.reset({
                    input: { identifier: IDENTITY, code: "master-code" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.second-factor.INVALID_CODE");

            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("throws when the master code does not match", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            account.masterCode = helpers.createMasterCode({ account });
            account.secondFactors = helpers.collection({ owner: account, items: [] });
            const { service, repositories, services, transaction } = helpers.service({ account });
            services.hashing.verify.mockImplementation(() => Promise.resolve(false));
            repositories.identifiers.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            await expect(
                service.reset({
                    input: { identifier: IDENTITY, code: "wrong-code" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.second-factor.INVALID_CODE");

            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("removes every factor and the master code for a valid code", async () => {
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

            const result = await service.reset({
                input: { identifier: IDENTITY, code: "master-code" },
                transaction: transaction.entityManager,
            });

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

    describe("acceptCode", () => {
        it("throws when the totp service rejects the code", async () => {
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const acceptTOTPSpy = jest.spyOn(factor, "acceptTOTP");
            services.totp.verify.mockImplementation(() => null);

            await expect(service.acceptCode({ input: { factor, code: "000000" } })).rejects.toThrow(
                "services.second-factor.INVALID_TOTP_CODE",
            );

            expect(acceptTOTPSpy).not.toHaveBeenCalled();
        });

        it("throws when the entity rejects a replayed step", async () => {
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            jest.spyOn(factor, "acceptTOTP").mockImplementation(() => false);
            services.totp.verify.mockImplementation(() => ({ step: 42 }));

            await expect(service.acceptCode({ input: { factor, code: "123456" } })).rejects.toThrow(
                "services.second-factor.INVALID_TOTP_CODE",
            );
        });

        it("accepts the verified step on the factor", async () => {
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const acceptTOTPSpy = jest.spyOn(factor, "acceptTOTP");
            services.totp.verify.mockImplementation(() => ({ step: 42 }));
            services.secondFactorSecret.resolve.mockImplementation(() => Promise.resolve({ plaintext: "plain-secret" }));

            await service.acceptCode({ input: { factor, code: "123456" } });

            expect(services.secondFactorSecret.resolve).toHaveBeenCalledWith({ secret: factor.secret });
            expect(services.totp.verify).toHaveBeenCalledWith({ secret: "plain-secret", code: "123456" });
            expect(acceptTOTPSpy).toHaveBeenCalledWith(42);
        });

        it("rewraps the secret when the secret service returned a fresh ciphertext", async () => {
            const factor = createConfirmedFactor();
            const { service, services } = helpers.service();
            const rewrapSpy = jest.spyOn(factor, "rewrap");
            services.totp.verify.mockImplementation(() => ({ step: 42 }));
            services.secondFactorSecret.resolve.mockImplementation(() =>
                Promise.resolve({ plaintext: "plain-secret", ciphertext: "rewrapped-secret" }),
            );

            await service.acceptCode({ input: { factor, code: "123456" } });

            expect(rewrapSpy).toHaveBeenCalledWith("rewrapped-secret");
        });
    });
});
