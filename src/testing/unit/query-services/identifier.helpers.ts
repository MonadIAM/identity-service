import { jest } from "@jest/globals";

import { IdentifierQueries } from "~context/application/queries/identifier.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class IdentifierQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.IdentifierQueries.Contract
{
    public queries(): Unit.Application.IdentifierQueries.Queries.Result {
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
