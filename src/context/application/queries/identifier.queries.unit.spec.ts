import { describe, expect, it } from "@jest/globals";

import { IdentifierQueriesUnitHelpers } from "~testing/unit/query-services/identifier.helpers";
import { PublicLinkOperator } from "~infrastructure/database";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new IdentifierQueriesUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";
const ID = "entity-a";

describe("IdentifierQueries", () => {
    it.each([QueryMode.DEFAULT, QueryMode.MANAGE])(
        "applies account ownership in %s without changing caller filters",
        async (mode) => {
            const { queries, identifierRepository } = helpers.queries();
            const identifier = helpers.createIdentifier();
            const filters: Repositories.Mappers.Identifier.Filters = {
                account: { operator: PublicLinkOperator.EQUAL, value: ACCOUNT },
            };
            identifierRepository.findUniqueOrThrow.mockResolvedValue(identifier);
            identifierRepository.findMany.mockResolvedValue([[identifier], 12]);

            const found = await queries.findUnique({ view: ResponseViewType.COMPACT, mode, actor: ACTOR, identifier: ID });
            const page = await queries.findMany({
                view: ResponseViewType.COMPACT,
                mode,
                actor: ACTOR,
                filters,
                sort: {},
                pagination: PAGINATION,
            });

            expect(found).toBe(identifier);
            expect(page).toEqual([[identifier], 12]);
            expect(identifierRepository.findUniqueOrThrow.mock.calls).toEqual([
                [{ where: mode === QueryMode.DEFAULT ? { id: ID, account: ACTOR } : { id: ID } }],
            ]);
            expect(identifierRepository.findMany.mock.calls).toEqual([
                [
                    {
                        pagination: PAGINATION,
                        sort: {},
                        filters: {
                            account: {
                                operator: PublicLinkOperator.EQUAL,
                                value: mode === QueryMode.DEFAULT ? ACTOR : ACCOUNT,
                            },
                        },
                    },
                ],
            ]);
            expect(filters.account?.value).toBe(ACCOUNT);
        },
    );

    it("restricts lookup to the requested account and retains the search term", async () => {
        const { queries, identifierRepository } = helpers.queries();
        identifierRepository.getLookupList.mockResolvedValue([[], 0]);

        await queries.getLookupList({ account: ACTOR, term: "mail", pagination: PAGINATION });

        expect(identifierRepository.getLookupList.mock.calls).toEqual([
            [{ account: ACTOR, term: "mail", pagination: PAGINATION }],
        ]);
    });
});
