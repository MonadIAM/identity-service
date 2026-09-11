import { AccountService } from "~context/domain/services/account.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AccountUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Account.Contract {
    public service(props: Unit.Domain.Account.Service.Props = {}): Unit.Domain.Account.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new AccountService(this.contract<Repositories.Account.PublicContract>(repositories.accounts)),
            repositories,
            transaction,
        };
    }
}
