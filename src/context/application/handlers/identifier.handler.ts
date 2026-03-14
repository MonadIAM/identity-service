import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE, GOOGLE_OAUTH_SERVICE, GITHUB_OAUTH_SERVICE } from "~common/services";
import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE, OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierHandler implements Handlers.Identifier.Contract {
    private readonly dictionaryPath = "handlers.identifier";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.Contract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.Contract,
    ) {}

    public async requestAdd({ input: { account, type, value } }: Handlers.Identifier.RequestAdd): Promise<MessageResult> {
        try {
            const existing = await this.identifierRepository.findUnique({
                where: { type, value },
            });

            if (existing) {
                throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_EXISTS`);
            } else {
                const otp = this.cryptoService.generateOTP();
                await this.otpCacheService.setIdentifier({ code: otp, data: { account, type, value } });

                if (type === IdentifierType.EMAIL) {
                    await this.emailService.send({
                        to: value,
                        subject: "Verify your identifier",
                        html: `Your verification code: ${otp}`,
                    });
                } else if (type === IdentifierType.PHONE) {
                    await this.smsService.send({ to: value, body: `Your verification code: ${otp}` });
                }

                return { message: `${this.dictionaryPath}.VERIFICATION_CODE_SENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async confirmAdd({ input: { code }, context }: Handlers.Identifier.ConfirmAdd): Promise<MessageResult> {
        try {
            const data = await this.otpCacheService.getIdentifier({ code });

            if (data) {
                await this.otpCacheService.deleteIdentifier({ code });

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const account = await this.identifierRepository.findUniqueOrThrow({
                        where: { account: data.account },
                        transaction,
                    });

                    await this.identifierService.add({
                        input: {
                            identifier: {
                                type: data.type,
                                value: data.value,
                                isVerified: true,
                            },
                            account: account.account,
                        },
                        context,
                        transaction,
                    });
                });

                return { message: `${this.dictionaryPath}.IDENTIFIER_ADDED` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async addOAuth({
        input: { account, provider, code, state },
        context,
    }: Handlers.Identifier.AddOAuth): Promise<MessageResult> {
        try {
            const cached = await this.oauthStateCacheService.get({ state });

            if (cached?.provider !== provider) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
            }

            await this.oauthStateCacheService.delete({ state });

            const oauthService = this.resolveProvider(provider);
            const { access_token } = await oauthService.exchangeCode(code);
            const profile = await oauthService.fetchProfile(access_token);

            const existingByProvider = await this.identifierRepository.findUnique({
                where: { provider, providerUserId: profile.providerUserId },
            });

            if (existingByProvider) {
                throw HandlerException.conflict(`${this.dictionaryPath}.OAUTH_ALREADY_LINKED`);
            } else {
                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: account },
                        transaction,
                    });
                    await this.identifierService.add({
                        input: {
                            account: accountEntity,
                            identifier: {
                                value: profile.email ?? profile.providerUserId,
                                providerUserId: profile.providerUserId,
                                type: IdentifierType.OAUTH,
                                isVerified: true,
                                provider,
                            },
                        },
                        transaction,
                        context,
                    });
                });

                return { message: `${this.dictionaryPath}.OAUTH_LINKED` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async remove({ input: { identifier, account }, context }: Handlers.Identifier.Remove): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.remove({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.IDENTIFIER_REMOVED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async setPrimary({
        input: { identifier, account },
        context,
    }: Handlers.Identifier.SetPrimary): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.setPrimary({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.PRIMARY_CHANGED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async toggleNotifications({
        input: { identifier, account },
        context,
    }: Handlers.Identifier.ToggleNotifications): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.toggleNotifications({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.NOTIFICATIONS_TOGGLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async togglePasswordlessLogin({
        input: { identifier, account },
        context,
    }: Handlers.Identifier.TogglePasswordlessLogin): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.togglePasswordlessLogin({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.PASSWORDLESS_LOGIN_TOGGLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private resolveProvider(provider: string): OAuth.ResolveProvider {
        switch (provider) {
            case "google":
                return this.googleOAuthService;
            case "github":
                return this.githubOAuthService;
            default:
                throw HandlerException.badRequest(`${this.dictionaryPath}.UNSUPPORTED_PROVIDER`);
        }
    }
}
