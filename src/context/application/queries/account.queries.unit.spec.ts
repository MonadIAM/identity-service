import { describe, expect, it } from "@jest/globals";

import { AccountQueriesUnitHelpers } from "~testing/unit/query-services/account.helpers";
import { ResponseViewType, QueryMode, IdentifierType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AccountQueriesUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("[Queries] - Account", () => {
    describe("[Method] - getSecurity", () => {
        it.each([
            { hasPassword: false, confirmed: false, type: IdentifierType.EMAIL, verified: true, canConfirmByEmail: true },
            { hasPassword: true, confirmed: false, type: IdentifierType.EMAIL, verified: true, canConfirmByEmail: false },
            { hasPassword: false, confirmed: true, type: IdentifierType.EMAIL, verified: true, canConfirmByEmail: false },
            { hasPassword: true, confirmed: true, type: IdentifierType.EMAIL, verified: true, canConfirmByEmail: false },
            { hasPassword: false, confirmed: false, type: IdentifierType.EMAIL, verified: false, canConfirmByEmail: false },
            { hasPassword: false, confirmed: false, type: IdentifierType.PHONE, verified: true, canConfirmByEmail: false },
        ])(
            "[case] - resolves security methods for %j",
            async ({ hasPassword, confirmed, type, verified, canConfirmByEmail }) => {
                // Arrange
                const { queries, accountRepository } = helpers.queries();
                const account = helpers.createAccount({ id: ACCOUNT });
                if (hasPassword) {
                    account.password = helpers.createPassword({ account });
                }
                account.secondFactors = helpers.collection({
                    owner: account,
                    items: [
                        helpers.createSecondFactor({ account, confirmedAt: undefined }),
                        helpers.createSecondFactor({ account, confirmedAt: confirmed ? new Date() : undefined }),
                    ],
                });
                account.identifiers = helpers.collection({
                    owner: account,
                    items: [helpers.createIdentifier({ account, type, isVerified: verified })],
                });
                accountRepository.findUniqueOrThrow.mockResolvedValue(account);

                // Act
                const result = await queries.getSecurity({ account: ACCOUNT });

                // Assert
                expect(result).toEqual({ hasPassword, hasSecondFactor: confirmed, canConfirmByEmail });
                expect(accountRepository.findUniqueOrThrow.mock.calls).toEqual([
                    [{ options: { populate: ["password", "secondFactors", "identifiers"] }, where: { id: ACCOUNT } }],
                ]);
            },
        );

        it("[case] - reports no available methods for an account without credentials", async () => {
            // Arrange
            const { queries, accountRepository } = helpers.queries();
            accountRepository.findUniqueOrThrow.mockResolvedValue(helpers.createAccount({ id: ACCOUNT }));

            // Act
            const result = queries.getSecurity({ account: ACCOUNT });

            // Assert
            await expect(result).resolves.toEqual({
                hasPassword: false,
                hasSecondFactor: false,
                canConfirmByEmail: false,
            });
        });
    });

    describe("[Behavior] - account lookup", () => {
        it.each([ResponseViewType.COMPACT, ResponseViewType.DETAILED])(
            "[case] - loads the relations requested by %s",
            async (view) => {
                // Arrange
                const { queries, accountRepository } = helpers.queries();
                const account = helpers.createAccount();
                accountRepository.findUniqueOrThrow.mockResolvedValue(account);
                accountRepository.findMany.mockResolvedValue([[account], 12]);
                const populate: ("profile" | "identifiers")[] =
                    view === ResponseViewType.COMPACT ? ["profile"] : ["profile", "identifiers"];

                // Act
                const own = await queries.findMe({ account: ACTOR, view });
                const found = await queries.findUnique({ mode: QueryMode.MANAGE, account: ACCOUNT, view });
                const page = await queries.findMany({
                    mode: QueryMode.MANAGE,
                    pagination: PAGINATION,
                    filters: {},
                    sort: {},
                    view,
                });

                // Assert
                expect(own).toBe(account);
                expect(found).toBe(account);
                expect(page).toEqual([[account], 12]);
                expect(accountRepository.findUniqueOrThrow.mock.calls[0]).toEqual([
                    { where: { id: ACTOR }, options: { populate } },
                ]);
                expect(accountRepository.findUniqueOrThrow.mock.calls[1]).toEqual([
                    { where: { id: ACCOUNT }, options: { populate } },
                ]);
                expect(accountRepository.findMany.mock.calls).toEqual([
                    [{ pagination: PAGINATION, filters: {}, sort: {}, options: { populate } }],
                ]);
            },
        );
    });
});
