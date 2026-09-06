import { Inject, Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { ReauthenticationTopicAction, EntityType, KafkaTopic, ActionType } from "~context/enums";
import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { HASHING_SERVICE, TOTP_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { ReauthenticationMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ReauthenticationCommands implements Commands.Reauthentication.Contract {
    private readonly mapper: Commands.Mappers.Reauthentication.Contract;
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
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(TOTP_SERVICE)
        private readonly totpService: CommonServices.TOTP.PublicContract,
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.PublicContract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.CommandContract,
        protected readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("REAUTHENTICATION_TTL")) / 1e3;
        this.mapper = new ReauthenticationMapper();
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

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
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
                const factor = await this.secondFactorRepository.findUnique({
                    options: { lockMode: LockMode.PESSIMISTIC_WRITE },
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

                const verification = this.totpService.verify({ secret: plaintext, code: props.input.code });

                if (!verification) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
                }

                const accepted = this.secondFactorService.acceptTOTP({
                    input: { factor, step: verification.step },
                    transaction,
                });

                if (!accepted) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
                }

                if (ciphertext) {
                    this.secondFactorService.rewrap({ input: { factor, secret: ciphertext }, transaction });
                }

                return { session: props.session, expiresAt };
            },
        });

        return { message: `${this.dictionaryPath}.REAUTHENTICATED` };
    }
}
