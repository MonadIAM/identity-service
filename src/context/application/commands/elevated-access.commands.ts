import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { ELEVATED_ACCESS_CACHE_SERVICE } from "~context/infrastructure/services";
import { CommandException } from "~common/exceptions";
import { HASHING_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class ElevatedAccessCommands implements Commands.ElevatedAccess.Contract {
    private readonly dictionaryPath = "commands.elevated-access";

    public constructor(
        @Inject(ELEVATED_ACCESS_CACHE_SERVICE)
        private readonly elevatedAccessCacheService: InfrastructureServices.ElevatedAccessCache.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
    ) {}

    public async byPassword(props: Commands.ElevatedAccess.ByPassword.Props): Commands.ElevatedAccess.ByPassword.Result {
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password"] },
            where: { id: props.actor },
        });

        if (!account.password) {
            throw CommandException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
        }

        const isValid = await this.hashingService.verify({
            storedHash: account.password.hash,
            value: props.input.password,
        });

        if (!isValid) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_PASSWORD`);
        }

        await this.elevatedAccessCacheService.set({ account: props.actor });
        return { message: `${this.dictionaryPath}.ELEVATED` };
    }

    public async bySecondFactor(
        props: Commands.ElevatedAccess.BySecondFactor.Props,
    ): Commands.ElevatedAccess.BySecondFactor.Result {
        const factor = await this.secondFactorRepository.findUnique({
            where: {
                confirmedAt: { $ne: null },
                account: props.actor,
            },
        });

        if (!factor) {
            throw CommandException.badRequest(`${this.dictionaryPath}.NO_ACTIVE_2FA`);
        }

        const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
        const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

        if (!isValid) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
        }

        await this.elevatedAccessCacheService.set({ account: props.actor });
        return { message: `${this.dictionaryPath}.ELEVATED` };
    }
}
