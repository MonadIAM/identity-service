import { jest } from "@jest/globals";

import { ReauthenticationCommands } from "~context/application/commands/reauthentication.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class ReauthenticationCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.Reauthentication.Contract
{
    public commands(): Unit.Commands.Reauthentication.Commands.Result {
        const execution = this.execution();

        const accountRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Account.PublicContract["findUniqueOrThrow"]>(),
        };
        const hashingService = {
            verify: jest.fn<CommonServices.Hashing.PublicContract["verify"]>(),
        };
        const secondFactorService = {
            reauthenticate: jest.fn<Services.SecondFactor.CommandContract["reauthenticate"]>(),
        };
        const reauthenticationCacheService = {
            set: jest.fn<InfrastructureServices.ReauthenticationCache.PublicContract["set"]>(),
        };
        const otpCacheService = {
            set: jest.fn<InfrastructureServices.OTPCache.PublicContract["set"]>(),
            consume: jest.fn<InfrastructureServices.OTPCache.PublicContract["consume"]>(),
        };
        const cryptoService = {
            generateOTP: jest.fn<CommonServices.Crypto.PublicContract["generateOTP"]>(),
            hashToken: jest.fn<CommonServices.Crypto.PublicContract["hashToken"]>(),
        };
        const configService = this.config({
            values: {
                REAUTHENTICATION_TTL: "5m",
            },
        });

        return {
            ...execution,
            secondFactorService,
            reauthenticationCacheService,
            otpCacheService,
            cryptoService,
            accountRepository,
            hashingService,
            configService,
            commands: new ReauthenticationCommands(
                this.contract<InfrastructureServices.ReauthenticationCache.PublicContract>(reauthenticationCacheService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                execution.transactional,
                this.contract<Repositories.Account.PublicContract>(accountRepository),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<Services.SecondFactor.CommandContract>(secondFactorService),
                configService,
            ),
        };
    }
}
