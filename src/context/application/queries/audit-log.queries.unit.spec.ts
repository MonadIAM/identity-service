import { describe, expect, it } from "@jest/globals";

import { AuditLogQueriesUnitHelpers } from "~testing/unit/query-services/audit-log.helpers";

const PAGINATION: Pagination = { currentPage: 2, elementsPerPage: 10 };
const helpers = new AuditLogQueriesUnitHelpers();
const ID = "entity-a";

describe("AuditLogQueries", () => {
    it("loads the requested log and preserves the returned page", async () => {
        const { queries, auditLogRepository: repository } = helpers.queries();
        const log = helpers.createAuditLog();
        const page: [SystemEntities.AuditLog[], number] = [[log], 30];
        repository.findUniqueOrThrow.mockResolvedValue(log);
        repository.findMany.mockResolvedValue(page);

        const single = await queries.findUnique({ log: ID });
        const result = await queries.findMany({ pagination: PAGINATION, filters: {}, sort: {} });

        expect(single).toBe(log);
        expect(result).toBe(page);
        expect(repository.findUniqueOrThrow.mock.calls).toEqual([[{ where: { id: ID } }]]);
        expect(repository.findMany.mock.calls).toEqual([[expect.objectContaining({ pagination: PAGINATION })]]);
    });
});
