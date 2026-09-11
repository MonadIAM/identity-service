import { SecondFactorService } from "~context/domain/services/second-factor.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class SecondFactorUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.SecondFactor.Contract {
    public service(props: Unit.Domain.SecondFactor.Service.Props = {}): Unit.Domain.SecondFactor.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const services = this.services();

        return {
            service: new SecondFactorService(
                this.contract<InfrastructureServices.SecondFactorSecret.PublicContract>(services.secondFactorSecret),
                this.contract<Repositories.SecondFactor.PublicContract>(repositories.secondFactors),
                this.contract<Repositories.Identifier.PublicContract>(repositories.identifiers),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
                this.contract<CommonServices.Hashing.PublicContract>(services.hashing),
                this.contract<CommonServices.TOTP.PublicContract>(services.totp),
            ),
            repositories,
            transaction,
            services,
        };
    }
}
