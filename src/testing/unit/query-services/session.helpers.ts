import { jest } from "@jest/globals";

import { SessionQueries } from "~context/application/queries/session.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class SessionQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.SessionQueries.Contract
{
    public queries(): Unit.Application.SessionQueries.Queries.Result {
        const sessionRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Session.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Session.QueryContract["findMany"]>(),
        };

        return {
            sessionRepository,
            queries: new SessionQueries(this.contract<Repositories.Session.QueryContract>(sessionRepository)),
        };
    }
}
