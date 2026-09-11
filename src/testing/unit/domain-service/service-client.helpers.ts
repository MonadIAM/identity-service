import { ServiceClientService } from "~context/domain/services/service-client.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ServiceClientUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.ServiceClient.Contract {
    public service(props: Unit.Domain.ServiceClient.Service.Props = {}): Unit.Domain.ServiceClient.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new ServiceClientService(
                this.contract<Repositories.ServiceClient.PublicContract>(repositories.serviceClients),
                this.contract<Repositories.Application.PublicContract>(repositories.applications),
            ),
            repositories,
            transaction,
        };
    }
}
