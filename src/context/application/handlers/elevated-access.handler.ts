import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { ELEVATED_ACCESS_CACHE_SERVICE } from "~context/infrastructure/services";
import { HandlerException } from "~common/exceptions";
import { HASHING_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class ElevatedAccessHandler implements Handlers.ElevatedAccess.Contract {
    private readonly dictionaryPath = "handlers.elevated-access";

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

    public async byPassword(props: Handlers.ElevatedAccess.ByPassword): Promise<MessageResult> {
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password"] },
            where: { id: props.actor },
        });

        if (account.password) {
            const isValid = await this.hashingService.verify({
                storedHash: account.password.hash,
                value: props.input.password,
            });

            if (isValid) {
                await this.elevatedAccessCacheService.set({ account: props.actor });
                return { message: `${this.dictionaryPath}.CONFIRMED` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_PASSWORD`);
            }
        } else {
            throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
        }
    }

    public async bySecondFactor(props: Handlers.ElevatedAccess.BySecondFactor): Promise<MessageResult> {
        const factor = await this.secondFactorRepository.findUnique({
            where: {
                confirmedAt: { $ne: null },
                account: props.actor,
            },
        });

        if (factor) {
            const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
            const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

            if (isValid) {
                await this.elevatedAccessCacheService.set({ account: props.actor });
                return { message: `${this.dictionaryPath}.CONFIRMED` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
            }
        } else {
            throw HandlerException.badRequest(`${this.dictionaryPath}.NO_ACTIVE_2FA`);
        }
    }
}
