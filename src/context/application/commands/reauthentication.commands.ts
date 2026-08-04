import { ReauthenticationTopicAction } from "@monadiam/shared";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TOTP, Secret } from "otpauth";
import ms, { StringValue } from "ms";

import { ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/domain/repositories";
import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services";
import { EntityType, KafkaTopic, ActionType } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { SECOND_FACTOR_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class ReauthenticationCommands implements Commands.Reauthentication.Contract {
    private readonly dictionaryPath = "commands.reauthentication";
    private readonly resource = "Reauthentication";
    private readonly ttl: number;

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.CommandContract,
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.Contract,
        protected readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("REAUTHENTICATION_TTL")) / 1e3;
    }

    public async byPassword(
        props: Commands.Reauthentication.ByPassword.Props,
    ): Commands.Reauthentication.ByPassword.Result {
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password"] },
            where: { id: props.actor },
        });

        if (!account.password) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
        }

        const isValid = await this.hashingService.verify({
            storedHash: account.password.hash,
            value: props.input.password,
        });

        if (!isValid) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_PASSWORD` });
        }

        await this.transactionalService.emit({
            payload: { session: props.session, expiresAt: Date.now() + this.ttl * 1e3 },
            destinationTopic: KafkaTopic.REAUTHENTICATION,
            actionType: ReauthenticationTopicAction.GRANT,
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.GRANT,
                ...props,
            },
            resource: this.resource,
        });

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
    }

    public async bySecondFactor(
        props: Commands.Reauthentication.BySecondFactor.Props,
    ): Commands.Reauthentication.BySecondFactor.Result {
        const expiresAt = Date.now() + this.ttl * 1e3;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: () => ({ session: props.session, expiresAt }),
                destinationTopic: KafkaTopic.REAUTHENTICATION,
                actionType: ReauthenticationTopicAction.GRANT,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.GRANT,
                ...props,
            },
            execute: async (transaction) => {
                const factor = await this.secondFactorRepository.findUnique({
                    where: {
                        confirmedAt: { $ne: null },
                        account: props.actor,
                    },
                    transaction,
                });

                if (!factor) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_ACTIVE_2FA` });
                }

                const { ciphertext, plaintext } = await this.secondFactorSecretService.resolve({
                    secret: factor.secret,
                });
                const totp = new TOTP({ secret: Secret.fromBase32(plaintext) });
                const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

                if (!isValid) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
                }

                if (ciphertext) {
                    this.secondFactorService.rewrap({ input: { factor, secret: ciphertext }, transaction });
                }
            },
        });

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
    }
}
