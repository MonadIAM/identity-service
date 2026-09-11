import { RecoveryCodeService } from "~context/domain/services/recovery-code.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RecoveryCodeUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.RecoveryCode.Contract {
    public service(props: Unit.Domain.RecoveryCode.Service.Props = {}): Unit.Domain.RecoveryCode.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new RecoveryCodeService(this.contract<Repositories.Account.PublicContract>(repositories.accounts)),
            repositories,
            transaction,
        };
    }
}
