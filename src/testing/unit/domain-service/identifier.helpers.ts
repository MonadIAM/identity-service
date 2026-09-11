import { IdentifierService } from "~context/domain/services/identifier.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class IdentifierUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Identifier.Contract {
    public service(props: Unit.Domain.Identifier.Service.Props = {}): Unit.Domain.Identifier.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new IdentifierService(
                this.contract<Repositories.Identifier.PublicContract>(repositories.identifiers),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
            ),
            repositories,
            transaction,
        };
    }
}
