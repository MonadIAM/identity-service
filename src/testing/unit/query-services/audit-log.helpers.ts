import { jest } from "@jest/globals";

import { AuditLogQueries } from "~context/application/queries/audit-log.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AuditLogQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.AuditLog.Contract {
    public queries(): Unit.Queries.AuditLog.Queries.Result {
        const auditLogRepository = {
            findUniqueOrThrow: jest.fn<Repositories.AuditLog.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.AuditLog.QueryContract["findMany"]>(),
        };

        return {
            auditLogRepository,
            queries: new AuditLogQueries(this.contract<Repositories.AuditLog.QueryContract>(auditLogRepository)),
        };
    }
}
