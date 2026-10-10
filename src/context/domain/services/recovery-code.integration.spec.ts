import { describe, expect, it } from "@jest/globals";

import { RecoveryCodeIntegrationHelpers } from "~testing/integration/domain-service/recovery-code.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RecoveryCode } from "~context/domain/entities";

const helpers = new RecoveryCodeIntegrationHelpers();

async function loadRecoveryCodes(
    suite: Integration.Domain.RecoveryCode.Suite,
    account: Entities.Account,
): Promise<Entities.RecoveryCode[]> {
    return await suite.transaction((transaction) =>
        transaction.find(RecoveryCode, { account: account.id }, { orderBy: { hash: "asc" } }),
    );
}

describe("[DomainService] - RecoveryCode", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - generate", () => {
        it("[case] - generates all recovery codes", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            await suite.transaction(async (transaction) => {
                await Promise.resolve(
                    suite.repository().recoveryCodeService.generate({
                        input: {
                            hashes: ["hash:first", "hash:second"],
                            account,
                        },
                        transaction,
                    }),
                );
            });
            const codes = await loadRecoveryCodes(suite, account);
            const result = codes.map(({ hash }) => hash);

            // Assert
            expect(result).toEqual(["hash:first", "hash:second"]);
        });

        it("[case] - rolls back generated recovery codes on duplicate hashes", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
            await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

            // Act
            const result = suite.transaction(async (transaction) => {
                await Promise.resolve(
                    suite.repository().recoveryCodeService.generate({
                        input: {
                            hashes: ["hash:third", "hash:third"],
                            account,
                        },
                        transaction,
                    }),
                );
            });
            await Promise.allSettled([result]);
            const codes = await loadRecoveryCodes(suite, account);
            const result1 = codes.map(({ hash }) => hash);

            // Assert
            await expect(result).rejects.toThrow("recovery_code_account_hash_unique");
            expect(result1).toEqual(["hash:first", "hash:second"]);
        });
    });

    describe("[Method] - regenerate", () => {
        it("[case] - regenerates recovery codes by replacing the old set", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const first = await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
            const second = await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().recoveryCodeService.regenerate({
                    input: {
                        hashes: ["hash:third", "hash:fourth"],
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const regenerated = await loadRecoveryCodes(suite, account);
            const result = regenerated.map(({ hash }) => hash);
            const result1 = regenerated.map(({ id }) => id);

            // Assert
            expect(result).toEqual(["hash:fourth", "hash:third"]);
            expect(result1).not.toEqual(expect.arrayContaining([first.id, second.id]));
        });

        it("[case] - rolls back regenerated recovery codes on duplicate hashes", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
            await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().recoveryCodeService.regenerate({
                    input: {
                        hashes: ["hash:third", "hash:fourth"],
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const regenerated = await loadRecoveryCodes(suite, account);
            const result = suite.transaction((transaction) =>
                suite.repository().recoveryCodeService.regenerate({
                    input: {
                        hashes: ["hash:fifth", "hash:fifth"],
                        account: account.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const afterRollback = await loadRecoveryCodes(suite, account);
            const result1 = afterRollback.map(({ id }) => id).sort();

            // Assert
            await expect(result).rejects.toThrow("recovery_code_account_hash_unique");
            expect(result1).toEqual(regenerated.map(({ id }) => id).sort());
        });
    });
});
