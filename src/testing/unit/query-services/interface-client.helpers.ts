import { jest } from "@jest/globals";

import { InterfaceClientQueries } from "~context/application/queries/interface-client.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class InterfaceClientQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.InterfaceClientQueries.Contract
{
    public queries(): Unit.Application.InterfaceClientQueries.Queries.Result {
        const interfaceClientRepository = {
            findUniqueOrThrow: jest.fn<Repositories.InterfaceClient.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.InterfaceClient.QueryContract["findMany"]>(),
        };

        return {
            interfaceClientRepository,
            queries: new InterfaceClientQueries(
                this.contract<Repositories.InterfaceClient.QueryContract>(interfaceClientRepository),
            ),
        };
    }
}
