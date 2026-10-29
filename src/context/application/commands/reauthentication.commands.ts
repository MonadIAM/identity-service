import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { OTP_CACHE_SERVICE, REAUTHENTICATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";
import {
    ReauthenticationTopicAction,
    NotificationTopicAction,
    IdentifierType,
    EntityType,
    KafkaTopic,
    ActionType,
} from "~context/enums";

import { ReauthenticationMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ReauthenticationCommands implements Commands.Reauthentication.Contract {
    private readonly mapper: Commands.Mappers.Reauthentication.Contract;
    private readonly dictionaryPath = "commands.reauthentication";
    private readonly resource = "Reauthentication";
    private readonly ttl: number;

    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.CommandContract,
        protected readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("REAUTHENTICATION_TTL")) / 1e3;
        this.mapper = new ReauthenticationMapper();
    }

    public async resolveEmail(
        props: Commands.Reauthentication.ResolveEmail.Props,
    ): Commands.Reauthentication.ResolveEmail.Result {
        const account = await this.accountRepository.findUniqueOrThrow({
            transaction: props.transaction,
            options: {
                populate: ["password", "secondFactors", "identifiers"],
                orderBy: { identifiers: { createdAt: "asc", id: "asc" } },
            },
            where: { id: props.actor },
        });

        if (account.password || account.secondFactors.getItems().some((factor) => Boolean(factor.confirmedAt))) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.EMAIL_CONFIRMATION_UNAVAILABLE` });
        } else {
            const identifier = account.identifiers.getItems().find((item) => {
                return item.type === IdentifierType.EMAIL && item.isVerified;
            });

            if (identifier) {
                return identifier;
            } else {
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.VERIFIED_EMAIL_REQUIRED` });
            }
        }
    }

    public async requestOTP(
        props: Commands.Reauthentication.RequestOTP.Props,
    ): Commands.Reauthentication.RequestOTP.Result {
        const otp = this.cryptoService.generateOTP();
        const hash = this.cryptoService.hashToken({ token: `${props.actor}:${props.session}:${otp}` });

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationPayload,
                destinationTopic: KafkaTopic.NOTIFICATION,
                actionType: NotificationTopicAction.CREATE,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REGENERATE,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.resolveEmail({ actor: props.actor, transaction });

                await this.otpCacheService.set({
                    value: `${identifier.id}:${hash}`,
                    purpose: "reauthentication",
                    key: props.session,
                });

                return { account: props.actor, address: identifier.identity, otp };
            },
        });

        return { message: `${this.dictionaryPath}.CODE_SENT` };
    }

    public async byOTP(props: Commands.Reauthentication.ByOTP.Props): Commands.Reauthentication.ByOTP.Result {
        const expiresAt = Date.now() + this.ttl * 1e3;
        const hash = this.cryptoService.hashToken({ token: `${props.actor}:${props.session}:${props.input.code}` });

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.grantPayload,
                destinationTopic: KafkaTopic.REAUTHENTICATION,
                actionType: ReauthenticationTopicAction.GRANT,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.GRANT,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.resolveEmail({ actor: props.actor, transaction });
                const expected = await this.otpCacheService.consume({ purpose: "reauthentication", key: props.session });
                const actual = `${identifier.id}:${hash}`;

                if (expected && expected === actual) {
                    return { session: props.session, expiresAt };
                } else {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
                }
            },
        });

        await this.reauthenticationCacheService.set({ session: props.session, ttl: this.ttl });

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
    }

    public async byPassword(
        props: Commands.Reauthentication.ByPassword.Props,
    ): Commands.Reauthentication.ByPassword.Result {
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
                await this.transactionalService.emit({
                    payload: this.mapper.grantPayload({ session: props.session, expiresAt: Date.now() + this.ttl * 1e3 }),
                    destinationTopic: KafkaTopic.REAUTHENTICATION,
                    actionType: ReauthenticationTopicAction.GRANT,
                    resource: this.resource,
                    audit: {
                        entityType: EntityType.SESSION,
                        actionType: ActionType.GRANT,
                        ...props,
                    },
                });

                await this.reauthenticationCacheService.set({ session: props.session, ttl: this.ttl });

                return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_PASSWORD` });
            }
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
        }
    }

    public async bySecondFactor(
        props: Commands.Reauthentication.BySecondFactor.Props,
    ): Commands.Reauthentication.BySecondFactor.Result {
        const expiresAt = Date.now() + this.ttl * 1e3;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.grantPayload,
                destinationTopic: KafkaTopic.REAUTHENTICATION,
                actionType: ReauthenticationTopicAction.GRANT,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.GRANT,
                ...props,
            },
            execute: async (transaction) => {
                await this.secondFactorService.reauthenticate({
                    input: { account: props.actor, code: props.input.code },
                    transaction,
                });

                return { session: props.session, expiresAt };
            },
        });

        await this.reauthenticationCacheService.set({ session: props.session, ttl: this.ttl });

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
    }
}
