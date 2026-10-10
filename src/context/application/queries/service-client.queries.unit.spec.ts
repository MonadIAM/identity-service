import { describe, expect, it } from "@jest/globals";

import { ServiceClientQueriesUnitHelpers } from "~testing/unit/query-services/service-client.helpers";
import { QueryMode, ResponseViewType } from "~context/enums";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new ServiceClientQueriesUnitHelpers();
const REALM = "realm-a";
const ID = "entity-a";

describe("[Queries] - ServiceClient", () => {
    describe("[Behavior] - record lookup", () => {
        it.each([
            { mode: QueryMode.DEFAULT, scope: { realm: REALM } },
            { mode: QueryMode.MANAGE, scope: {} },
        ])("[case] - $mode enforces the appropriate ownership scope on single and paged reads", async ({ mode, scope }) => {
            // Arrange
            const { queries, serviceClientRepository: repository } = helpers.queries();
            repository.findUniqueOrThrow.mockResolvedValue(helpers.createServiceClient());
            repository.findMany.mockResolvedValue([[], 0]);

            // Act
            await queries.findUnique({ view: ResponseViewType.COMPACT, mode, realm: REALM, client: ID });
            await queries.findMany({
                view: ResponseViewType.COMPACT,
                mode,
                realm: REALM,
                pagination: PAGINATION,
                filters: {},
                sort: {},
            });

            // Assert
            expect(repository.findUniqueOrThrow.mock.calls).toEqual([
                [expect.objectContaining({ where: { id: ID, ...scope } })],
            ]);
            expect(repository.findMany.mock.calls).toEqual([[expect.objectContaining({ prefilter: scope })]]);
        });
    });
});
