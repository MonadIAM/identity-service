import { jest } from "@jest/globals";

import { SessionQueries } from "~context/application/queries/session.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class SessionQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.Session.Contract {
    public queries(): Unit.Queries.Session.Queries.Result {
        const sessionRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Session.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Session.QueryContract["findMany"]>(),
        };

        return {
            queries: new SessionQueries(this.contract<Repositories.Session.QueryContract>(sessionRepository)),
            sessionRepository,
        };
    }
}
