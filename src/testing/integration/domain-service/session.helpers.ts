import { ConfigService } from "@nestjs/config";

import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { SessionRepository } from "~context/infrastructure/repositories/session.repository";
import { IntegrationServiceMockBank } from "~testing/integration/service-mock-bank";
import { SessionService } from "~context/domain/services/session.service";

export class SessionIntegrationHelpers extends IntegrationServiceMockBank implements Integration.Domain.Session.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.Session.Service.Props = {},
    ): Integration.Domain.Session.Service.Context {
        const repositories = this.repositories(context);
        const crypto = this.crypto();
        const jwt = this.jwt();
        const config = this.config({
            maxActiveSessions: props.maxActiveSessions,
        });

        return {
            sessionService: new SessionService(repositories.sessions, repositories.accounts, crypto, jwt, config),
            services: {
                crypto,
                jwt,
            },
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Session.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
            sessions: new SessionRepository(context.readManager),
        };
    }

    public config(props: Integration.Domain.Session.Config.Props = {}): ConfigService {
        return new ConfigService({
            SESSION_MAX_ACTIVE_COUNT: props.maxActiveSessions ?? 3,
            SESSION_EXPIRY_DAYS: "30d",
            JWT_ACCESS_TTL: "15m",
        });
    }
}
