import { describe, expect, it } from "@jest/globals";

import { InterfaceClientQueriesUnitHelpers } from "~testing/unit/query-services/interface-client.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new InterfaceClientQueriesUnitHelpers();
const REALM = "realm-a";
const ID = "entity-a";

describe("InterfaceClientQueries", () => {
    describe("findUnique / findMany", () => {
        it.each([
            { mode: QueryMode.DEFAULT, scope: { realm: REALM } },
            { mode: QueryMode.MANAGE, scope: {} },
        ])("%s enforces the appropriate ownership scope on single and paged reads", async ({ mode, scope }) => {
            const { queries, interfaceClientRepository: repository } = helpers.queries();
            repository.findUniqueOrThrow.mockResolvedValue(helpers.createInterfaceClient());
            repository.findMany.mockResolvedValue([[], 0]);

            await queries.findUnique({ view: ResponseViewType.COMPACT, mode, realm: REALM, client: ID });
            await queries.findMany({
                view: ResponseViewType.COMPACT,
                pagination: PAGINATION,
                realm: REALM,
                filters: {},
                sort: {},
                mode,
            });

            expect(repository.findUniqueOrThrow.mock.calls).toEqual([
                [expect.objectContaining({ where: { id: ID, ...scope } })],
            ]);
            expect(repository.findMany.mock.calls).toEqual([[expect.objectContaining({ prefilter: scope })]]);
        });
    });
});
