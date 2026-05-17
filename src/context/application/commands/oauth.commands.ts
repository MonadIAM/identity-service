import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_SERVICE, IDENTIFIER_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { AccountSubject, AccountStatus, IdentifierType, IdentityActionType, EntityType } from "~context/enums";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthCommands implements Commands.OAuth.Contract {
    private readonly dictionaryPath = "commands.oauth";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async signup(props: Commands.OAuth.Signup.Props): Commands.OAuth.Signup.Result {
        const identifier = props.input.email
            ? await this.identifierRepository.findUnique({
                  options: { populate: ["account"] },
                  where: { type: IdentifierType.EMAIL, value: props.input.email },
              })
            : null;

        if (identifier) {
            return this.linkToExisting({ ...props, identifier });
        } else {
            return this.createNew(props);
        }
    }

    public async signin(props: Commands.OAuth.Signin.Props): Commands.OAuth.Signin.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_IN_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                return this.sessionService.create({
                    transaction,
                    input: {
                        account: props.input.account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_IN`,
            ...session,
        };
    }

    public async createNew(props: Commands.OAuth.Create.Props): Commands.OAuth.Create.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const result = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_UP_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: {
                            providerUserId: props.input.oauth.providerUserId,
                            provider: props.input.oauth.provider,
                            value: props.input.oauth.value,
                            type: props.input.oauth.type,
                            isVerified: true,
                        },
                        additionalIdentifier: props.input.email
                            ? { value: props.input.email, type: IdentifierType.EMAIL, isVerified: true }
                            : undefined,
                        profile: props.input.profile,
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.ACTIVE,
                    },
                });

                this.recoveryCodeService.generate({
                    transaction,
                    input: { account, hashes: hashedCodes },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_UP`,
            recoveryCodes: codes,
            ...result,
        };
    }

    public async linkToExisting(props: Commands.OAuth.Link.Props): Commands.OAuth.Link.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.LINK_OAUTH_IDENTIFIER,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                this.identifierService.create({
                    transaction,
                    input: {
                        identifier: {
                            providerUserId: props.input.oauth.providerUserId,
                            provider: props.input.oauth.provider,
                            value: props.input.oauth.value,
                            type: props.input.oauth.type,
                            isVerified: true,
                        },
                        account: props.identifier.account,
                    },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        account: props.identifier.account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.LINKED_AND_SIGNED_IN`,
            ...session,
        };
    }
}
