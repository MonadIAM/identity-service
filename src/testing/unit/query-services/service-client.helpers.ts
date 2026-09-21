import { jest } from "@jest/globals";

import { ServiceClientQueries } from "~context/application/queries/service-client.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ServiceClientQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.ServiceClientQueries.Contract
{
    public queries(): Unit.Application.ServiceClientQueries.Queries.Result {
        const serviceClientRepository = {
            findUniqueOrThrow: jest.fn<Repositories.ServiceClient.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.ServiceClient.QueryContract["findMany"]>(),
        };

        return {
            serviceClientRepository,
            queries: new ServiceClientQueries(
                this.contract<Repositories.ServiceClient.QueryContract>(serviceClientRepository),
            ),
        };
    }
}
