import { describe, expect, it } from "@jest/globals";

import { AccountQueriesUnitHelpers } from "~testing/unit/query-services/account.helpers";
import { ResponseViewType, QueryMode } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AccountQueriesUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("[Queries] - Account", () => {
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
