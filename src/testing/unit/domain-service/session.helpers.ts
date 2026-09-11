import { SessionService } from "~context/domain/services/session.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class SessionUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Session.Contract {
    public service(props: Unit.Domain.Session.Service.Props = {}): Unit.Domain.Session.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const services = this.services();
        const config = this.config({
            values: {
                SESSION_MAX_ACTIVE_COUNT: props.maxActiveSessions ?? 2,
                SESSION_EXPIRY_DAYS: props.sessionExpiryDays ?? "30d",
                JWT_ACCESS_TTL: props.accessTokenTTL ?? "15m",
            },
        });

        return {
            service: new SessionService(
                this.contract<Repositories.Session.PublicContract>(repositories.sessions),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
                this.contract<CommonServices.Crypto.Contract>(services.crypto),
                this.contract<CommonServices.JWT.Contract>(services.jwt),
                config,
            ),
            repositories,
            transaction,
            services,
        };
    }
}
