import { ApplicationService } from "~context/domain/services/application.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ApplicationUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Application.Contract {
    public service(props: Unit.Domain.Application.Service.Props = {}): Unit.Domain.Application.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new ApplicationService(
                this.contract<Repositories.Application.PublicContract>(repositories.applications),
            ),
            repositories,
            transaction,
        };
    }
}
