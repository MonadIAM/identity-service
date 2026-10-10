import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { RecoveryCodeUnitHelpers } from "~testing/unit/domain-service/recovery-code.helpers";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID     = "00000000-0000-4000-8000-500000000001";
const CODE_ID        = "00000000-0000-4000-8000-500000000002";
const SECOND_CODE_ID = "00000000-0000-4000-8000-500000000003";
/* eslint-enable prettier/prettier */

const helpers = new RecoveryCodeUnitHelpers();

describe("[DomainService] - RecoveryCode", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - generate", () => {
        it("[case] - persists one recovery code per given hash", () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });

            // Act
            service.generate({
                input: { account, hashes: ["hash-one", "hash-two"] },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(transaction.persist).toHaveBeenCalledTimes(2);
            expect(transaction.persist).toHaveBeenNthCalledWith(1, expect.objectContaining({ hash: "hash-one", account }));
            expect(transaction.persist).toHaveBeenNthCalledWith(2, expect.objectContaining({ hash: "hash-two", account }));
        });
    });

    describe("[Method] - regenerate", () => {
        it("[case] - removes every existing recovery code before generating the new set", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const existing = [
                helpers.createRecoveryCode({ id: CODE_ID, account }),
                helpers.createRecoveryCode({ id: SECOND_CODE_ID, account, hash: "old-two" }),
            ];
            account.recoveryCodes = helpers.collection({ owner: account, items: existing });
            const { service, repositories, transaction } = helpers.service({ account });

            // Act
            await service.regenerate({
                input: { account: ACCOUNT_ID, hashes: ["fresh-one"] },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                options: { populate: ["recoveryCodes"] },
                transaction: transaction.entityManager,
                where: { id: ACCOUNT_ID },
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, existing[0]);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, existing[1]);
            expect(transaction.persist).toHaveBeenCalledTimes(1);
            expect(transaction.persist).toHaveBeenCalledWith(expect.objectContaining({ hash: "fresh-one", account }));
        });
    });
});
