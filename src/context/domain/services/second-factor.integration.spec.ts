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

describe("SecondFactorService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("create", () => {
        it("creates one factor per account and type", async () => {
            const account = await suite.fixtures().createAccount();

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

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().secondFactorService.create({
                        input: {
                            type: SecondFactorType.TOTP,
                            secret: "another-secret",
                            name: "Another Authenticator",
                            account: account.id,
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.second-factor.TOTP_FACTOR_EXISTS");

            await expect(loadFactors(suite, account)).resolves.toHaveLength(1);
        });
    });

    describe("verify", () => {
        it("verifies a factor, rewraps its secret and bootstraps one master code", async () => {
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ account, secret: "plain-secret" });
            suite.repository().services.totp.setStep(10);
            suite.repository().services.secret.setResolvedCiphertext("ciphertext:v2");

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

            expect(factors[0]).toMatchObject({
                lastAcceptedTOTPStep: 10,
                secret: "ciphertext:v2",
                id: factor.id,
            });
            expect(factors[0]?.confirmedAt).toBeInstanceOf(Date);
            await expect(countMasterCodes(suite, account)).resolves.toBe(1);
        });

        it("verifies a factor without creating another master code when one already exists", async () => {
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                account,
            });
            await suite.fixtures().createMasterCode({
                account,
                hash: "hash:existing-master-code",
            });
            suite.repository().services.totp.setStep(10);

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

            expect(factors[0]?.confirmedAt).toBeInstanceOf(Date);
            await expect(countMasterCodes(suite, account)).resolves.toBe(1);
        });

        it("rolls back factor verification when the TOTP step is replayed", async () => {
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                lastAcceptedTOTPStep: 10,
                account,
            });
            suite.repository().services.totp.setStep(10);

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().secondFactorService.verify({
                        input: {
                            masterCodeHash: "hash:master-code",
                            code: "123456",
                            factor: factor.id,
                            account: account.id,
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.second-factor.INVALID_TOTP_CODE");

            const factors = await loadFactors(suite, account);

            expect(factors[0]?.confirmedAt).toBeNull();
            expect(factors[0]?.lastAcceptedTOTPStep).toBe(10);
            await expect(countMasterCodes(suite, account)).resolves.toBe(0);
        });
    });

    describe("authenticate", () => {
        it("authenticates only a confirmed factor owned by the account", async () => {
            const account = await suite.fixtures().createAccount();
            const other = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ confirmed: true, account });
            await suite.fixtures().createSecondFactor({ account: other });
            suite.repository().services.totp.setStep(5);

            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.authenticate({
                    input: {
                        account: account.id,
                        code: "123456",
                    },
                    transaction,
                }),
            );

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().secondFactorService.authenticate({
                        input: {
                            code: "123456",
                            account: other.id,
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");

            const factors = await loadFactors(suite, account);

            expect(factors.find(({ id }) => id === factor.id)?.lastAcceptedTOTPStep).toBe(5);
        });
    });

    describe("reauthenticate", () => {
        it("reauthenticates with a confirmed factor and leaves rows unchanged without one", async () => {
            const account = await suite.fixtures().createAccount();
            const withoutFactor = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({ confirmed: true, account });
            suite.repository().services.totp.setStep(3);

            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.reauthenticate({
                    input: {
                        code: "123456",
                        account: account.id,
                    },
                    transaction,
                }),
            );

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().secondFactorService.reauthenticate({
                        input: {
                            code: "123456",
                            account: withoutFactor.id,
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.second-factor.NO_ACTIVE_2FA");

            const factors = await loadFactors(suite, account);

            expect(factors.find(({ id }) => id === factor.id)?.lastAcceptedTOTPStep).toBe(3);
            await expect(loadFactors(suite, withoutFactor)).resolves.toHaveLength(0);
        });
    });

    describe("purge", () => {
        it("removes the master code when the last confirmed factor is purged", async () => {
            const account = await suite.fixtures().createAccount();
            const factor = await suite.fixtures().createSecondFactor({
                confirmed: true,
                account,
            });
            await suite.fixtures().createMasterCode({ account, hash: "hash:master-code" });

            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.purge({
                    input: {
                        target: factor.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );

            await expect(countMasterCodes(suite, account)).resolves.toBe(0);
            await expect(loadFactors(suite, account)).resolves.toHaveLength(0);
        });
    });

    describe("reset", () => {
        it("resets all second factors using a valid master code through an identifier", async () => {
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createIdentifier({
                identity: "factor-owner@example.test",
                type: IdentifierType.EMAIL,
                isVerified: true,
                account,
            });
            await suite.fixtures().createMasterCode({ account, hash: "hash:master-code" });
            await suite.fixtures().createSecondFactor({ confirmed: true, account });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().secondFactorService.reset({
                        input: {
                            identifier: "factor-owner@example.test",
                            code: "wrong-master-code",
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.second-factor.INVALID_CODE");

            await expect(loadFactors(suite, account)).resolves.toHaveLength(1);
            await expect(countMasterCodes(suite, account)).resolves.toBe(1);

            await suite.transaction((transaction) =>
                suite.repository().secondFactorService.reset({
                    input: {
                        identifier: "factor-owner@example.test",
                        code: "master-code",
                    },
                    transaction,
                }),
            );

            await expect(loadFactors(suite, account)).resolves.toHaveLength(0);
            await expect(countMasterCodes(suite, account)).resolves.toBe(0);
        });
    });
});
