import { describe, expect, it } from "@jest/globals";

import { SecondFactorIntegrationHelpers } from "~testing/integration/domain-service/second-factor.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { MasterCode, SecondFactor } from "~context/domain/entities";
import { IdentifierType, SecondFactorType } from "~context/enums";

const helpers = new SecondFactorIntegrationHelpers();

async function loadFactors(
    suite: Integration.Domain.SecondFactor.Suite,
    account: Entities.Account,
): Promise<Entities.SecondFactor[]> {
    return await suite.transaction((transaction) =>
        transaction.find(SecondFactor, { account: account.id }, { orderBy: { createdAt: "asc" } }),
    );
}

async function countMasterCodes(suite: Integration.Domain.SecondFactor.Suite, account: Entities.Account): Promise<number> {
    return await suite.transaction((transaction) =>
        transaction.count(MasterCode, {
            account: account.id,
        }),
    );
}

describe("[DomainService] - SecondFactor", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates one factor per account and type", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.create({
                    input: {
                        type: SecondFactorType.TOTP,
                        secret: "secret",
                        name: "Authenticator",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const result = suite.transaction((transaction) =>
                suite.repository().secondFactorService.create({
                    input: {
                        type: SecondFactorType.TOTP,
                        secret: "another-secret",
                        name: "Another Authenticator",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await loadFactors(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.TOTP_FACTOR_EXISTS");
            expect(result1).toHaveLength(1);
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - verifies a factor, rewraps its secret and bootstraps one master code", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ account, secret: "plain-secret" });
            suite.repository().services.totp.setStep(10);
            suite.repository().services.secret.setResolvedCiphertext("ciphertext:v2");

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.verify({
                    input: {
                        masterCodeHash: "hash:master-code",
                        code: "123456",
                        factor: factor.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const factors = await loadFactors(suite, account);
            const result = await countMasterCodes(suite, account);

            // Assert
            expect(factors[0]).toMatchObject({
                lastAcceptedTOTPStep: 10,
                secret: "ciphertext:v2",
                id: factor.id,
            });
            expect(factors[0]?.confirmedAt).toBeInstanceOf(Date);
            expect(result).toBe(1);
        });

        it("[case] - verifies a factor without creating another master code when one already exists", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                account,
            });
            await suite.fixtures().createMasterCode({
                account,
                hash: "hash:existing-master-code",
            });
            suite.repository().services.totp.setStep(10);

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.verify({
                    input: {
                        masterCodeHash: "hash:another-master-code",
                        code: "123456",
                        factor: factor.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const factors = await loadFactors(suite, account);
            const result = await countMasterCodes(suite, account);

            // Assert
            expect(factors[0]?.confirmedAt).toBeInstanceOf(Date);
            expect(result).toBe(1);
        });

        it("[case] - rolls back factor verification when the TOTP step is replayed", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                lastAcceptedTOTPStep: 10,
                account,
            });
            suite.repository().services.totp.setStep(10);

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().secondFactorService.verify({
                    input: {
                        masterCodeHash: "hash:master-code",
                        code: "123456",
                        factor: factor.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const factors = await loadFactors(suite, account);
            const result1 = await countMasterCodes(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_TOTP_CODE");
            expect(factors[0]?.confirmedAt).toBeNull();
            expect(factors[0]?.lastAcceptedTOTPStep).toBe(10);
            expect(result1).toBe(0);
        });
    });

    describe("[Method] - authenticate", () => {
        it("[case] - authenticates only a confirmed factor owned by the account", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const other = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ confirmed: true, account });
            await suite.fixtures().createSecondFactor({ account: other });
            suite.repository().services.totp.setStep(5);

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.authenticate({
                    input: {
                        account: account.id,
                        code: "123456",
                    },
                    transaction,
                }),
            );
            const result = suite.transaction((transaction) =>
                suite.repository().secondFactorService.authenticate({
                    input: {
                        code: "123456",
                        account: other.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const factors = await loadFactors(suite, account);
            const result1 = factors.find(({ id }) => id === factor.id)?.lastAcceptedTOTPStep;

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
            expect(result1).toBe(5);
        });
    });

    describe("[Method] - reauthenticate", () => {
        it("[case] - reauthenticates with a confirmed factor and leaves rows unchanged without one", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const withoutFactor = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ confirmed: true, account });
            suite.repository().services.totp.setStep(3);

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.reauthenticate({
                    input: {
                        code: "123456",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const result = suite.transaction((transaction) =>
                suite.repository().secondFactorService.reauthenticate({
                    input: {
                        code: "123456",
                        account: withoutFactor.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const factors = await loadFactors(suite, account);
            const result1 = factors.find(({ id }) => id === factor.id)?.lastAcceptedTOTPStep;
            const result2 = await loadFactors(suite, withoutFactor);

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");
            expect(result1).toBe(3);
            expect(result2).toHaveLength(0);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - removes the master code when the last confirmed factor is purged", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                confirmed: true,
                account,
            });
            await suite.fixtures().createMasterCode({ account, hash: "hash:master-code" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.purge({
                    input: {
                        target: factor.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const result = await countMasterCodes(suite, account);
            const result1 = await loadFactors(suite, account);

            // Assert
            expect(result).toBe(0);
            expect(result1).toHaveLength(0);
        });
    });

    describe("[Method] - reset", () => {
        it("[case] - resets all second factors using a valid master code through an identifier", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createIdentifier({
                identity: "factor-owner@example.test",
                type: IdentifierType.EMAIL,
                isVerified: true,
                account,
            });
            await suite.fixtures().createMasterCode({ account, hash: "hash:master-code" });
            await suite.fixtures().createSecondFactor({ confirmed: true, account });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().secondFactorService.reset({
                    input: {
                        identifier: "factor-owner@example.test",
                        code: "wrong-master-code",
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await loadFactors(suite, account);
            const result2 = await countMasterCodes(suite, account);
            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.reset({
                    input: {
                        identifier: "factor-owner@example.test",
                        code: "master-code",
                    },
                    transaction,
                }),
            );
            const result3 = await loadFactors(suite, account);
            const result4 = await countMasterCodes(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.second-factor.INVALID_CODE");
            expect(result1).toHaveLength(1);
            expect(result2).toBe(1);
            expect(result3).toHaveLength(0);
            expect(result4).toBe(0);
        });
    });
});
