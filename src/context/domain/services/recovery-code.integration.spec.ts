import { describe, expect, it } from "@jest/globals";

import { RecoveryCodeIntegrationHelpers } from "~testing/integration/domain-service/recovery-code.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
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

describe("RecoveryCodeService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("generates all recovery codes", async () => {
        const account = await suite.fixtures().createAccount();

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

        expect(codes.map(({ hash }) => hash)).toEqual(["hash:first", "hash:second"]);
    });

    it("rolls back generated recovery codes on duplicate hashes", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
        await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

        await expect(
            suite.transaction(async (transaction) => {
                await Promise.resolve(
                    suite.repository().recoveryCodeService.generate({
                        input: {
                            hashes: ["hash:third", "hash:third"],
                            account,
                        },
                        transaction,
                    }),
                );
            }),
        ).rejects.toThrow("recovery_code_account_hash_unique");

        const codes = await loadRecoveryCodes(suite, account);

        expect(codes.map(({ hash }) => hash)).toEqual(["hash:first", "hash:second"]);
    });

    it("regenerates recovery codes by replacing the old set", async () => {
        const account = await suite.fixtures().createAccount();
        const first = await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
        const second = await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

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

        expect(regenerated.map(({ hash }) => hash)).toEqual(["hash:fourth", "hash:third"]);
        expect(regenerated.map(({ id }) => id)).not.toEqual(expect.arrayContaining([first.id, second.id]));
    });

    it("rolls back regenerated recovery codes on duplicate hashes", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createRecoveryCode({ account, hash: "hash:first" });
        await suite.fixtures().createRecoveryCode({ account, hash: "hash:second" });

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

        await expect(
            suite.transaction((transaction) =>
                suite.repository().recoveryCodeService.regenerate({
                    input: {
                        hashes: ["hash:fifth", "hash:fifth"],
                        account: account.id,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("recovery_code_account_hash_unique");

        const afterRollback = await loadRecoveryCodes(suite, account);

        expect(afterRollback.map(({ id }) => id).sort()).toEqual(regenerated.map(({ id }) => id).sort());
    });
});
