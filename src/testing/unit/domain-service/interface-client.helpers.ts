import { InterfaceClientService } from "~context/domain/services/interface-client.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class InterfaceClientUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.InterfaceClient.Contract
{
    public service(props: Unit.Domain.InterfaceClient.Service.Props = {}): Unit.Domain.InterfaceClient.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const config = this.config({
            values: {
                INTERFACE_CLIENT_REDIRECT_URI_LIMIT: props.redirectUriLimit ?? 3,
            },
        });

        return {
            service: new InterfaceClientService(
                this.contract<Repositories.InterfaceClient.PublicContract>(repositories.interfaceClients),
                this.contract<Repositories.Application.PublicContract>(repositories.applications),
                config,
            ),
            repositories,
            transaction,
        };
    }
}
