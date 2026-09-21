import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class SessionCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.SessionCommands.Contract
{
    public async commands(): Unit.Application.SessionCommands.Commands.Result {
        const { SessionCommands } = await import("~context/application/commands/session.commands.js");
        const execution = this.execution();

        const refreshIdempotencyService = {
            get: jest.fn<InfrastructureServices.SessionRefreshIdempotency.PublicContract["get"]>(),
            set: jest.fn<InfrastructureServices.SessionRefreshIdempotency.PublicContract["set"]>(),
        };
        const jwtService = {
            verifyRefresh: jest.fn<CommonServices.JWT.PublicContract["verifyRefresh"]>(),
        };
        const cryptoService = {
            hashToken: jest.fn<CommonServices.Crypto.PublicContract["hashToken"]>(),
        };
        const sessionService = {
            revokeAll: jest.fn<Services.Session.CommandContract["revokeAll"]>(),
            refresh: jest.fn<Services.Session.CommandContract["refresh"]>(),
            create: jest.fn<Services.Session.CommandContract["create"]>(),
            revoke: jest.fn<Services.Session.CommandContract["revoke"]>(),
        };
        const configService = this.config({
            values: {
                JWT_ACCESS_TTL: "15m",
            },
        });

        return {
            ...execution,
            refreshIdempotencyService,
            sessionService,
            cryptoService,
            configService,
            jwtService,
            commands: new SessionCommands(
                this.contract<InfrastructureServices.SessionRefreshIdempotency.PublicContract>(refreshIdempotencyService),
                execution.transactional,
                this.contract<Services.Session.CommandContract>(sessionService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<CommonServices.JWT.PublicContract>(jwtService),
                configService,
            ),
        };
    }
}
