import { jest } from "@jest/globals";

import { IdentifierQueries } from "~context/application/queries/identifier.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class IdentifierQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.Identifier.Contract {
    public queries(): Unit.Queries.Identifier.Queries.Result {
        const identifierRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Identifier.QueryContract["findUniqueOrThrow"]>(),
            getLookupList: jest.fn<Repositories.Identifier.QueryContract["getLookupList"]>(),
            findMany: jest.fn<Repositories.Identifier.QueryContract["findMany"]>(),
        };

        return {
            identifierRepository,
            queries: new IdentifierQueries(this.contract<Repositories.Identifier.QueryContract>(identifierRepository)),
        };
    }
}
