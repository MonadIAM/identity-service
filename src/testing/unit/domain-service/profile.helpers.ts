import { ProfileService } from "~context/domain/services/profile.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ProfileUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Profile.Contract {
    public service(props: Unit.Domain.Profile.Service.Props = {}): Unit.Domain.Profile.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new ProfileService(this.contract<Repositories.Account.PublicContract>(repositories.accounts)),
            repositories,
            transaction,
        };
    }
}
