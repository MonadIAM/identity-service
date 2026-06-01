import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TOTP, Secret } from "otpauth";
import ms, { StringValue } from "ms";

import { IdentityActionType, EntityType, KafkaTopic, AggregateType, EventType } from "~context/enums";
import { ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";
import { HASHING_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class ElevatedAccessCommands implements Commands.ElevatedAccess.Contract {
    private readonly dictionaryPath = "commands.elevated-access";
    private readonly resource = "ElevatedAccess";
    private readonly ttl: number;

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        protected readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("ELEVATED_ACCESS_TTL")) / 1e3;
    }

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

        await this.transactionalService.emit({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.GRANT_ELEVATED_ACCESS,
                entityType: EntityType.SESSION,
                ...props,
            },
            destinationTopic: KafkaTopic.ELEVATED_ACCESS,
            aggregateType: AggregateType.ELEVATED_ACCESS,
            eventType: EventType.ELEVATED_ACCESS_GRANTED,
            payload: { session: props.session, expiresAt: Date.now() + this.ttl * 1e3 },
        });

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

        await this.transactionalService.emit({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.GRANT_ELEVATED_ACCESS,
                entityType: EntityType.SESSION,
                ...props,
            },
            destinationTopic: KafkaTopic.ELEVATED_ACCESS,
            aggregateType: AggregateType.ELEVATED_ACCESS,
            eventType: EventType.ELEVATED_ACCESS_GRANTED,
            payload: { session: props.session, expiresAt: Date.now() + this.ttl * 1e3 },
        });

        return { message: `${this.dictionaryPath}.ELEVATED` };
    }
}
