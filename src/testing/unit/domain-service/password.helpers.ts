import { PasswordService } from "~context/domain/services/password.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PasswordUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Password.Contract {
    public service(props: Unit.Domain.Password.Service.Props = {}): Unit.Domain.Password.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const services = this.services();
        const config = this.config({
            values: {
                PASSWORD_HISTORY_CHECK_DAYS: props.historyCheckDays ?? "90d",
            },
        });

        return {
            service: new PasswordService(
                this.contract<Repositories.PasswordHistory.PublicContract>(repositories.passwordHistories),
                this.contract<Repositories.Identifier.PublicContract>(repositories.identifiers),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
                this.contract<CommonServices.Hashing.PublicContract>(services.hashing),
                config,
            ),
            repositories,
            transaction,
            services,
        };
    }
}
