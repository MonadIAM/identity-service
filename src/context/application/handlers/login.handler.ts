import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { TOTP } from "otpauth";

import { IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, JWT_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE, PENDING_AUTH_CACHE_SERVICE } from "~context/infrastructure/services";
import { IdentifierType, SecondFactorType } from "~context/enums";
import { SESSION_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class LoginHandler implements Handlers.Login.Contract {
    private readonly dictionaryPath = "handlers.login";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(PENDING_AUTH_CACHE_SERVICE)
        private readonly pendingAuthCacheService: InfrastructureServices.PendingAuthCache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {}

    public async byPassword({
        input: { identifier, password },
        context,
    }: Handlers.Login.ByPassword.Props): Promise<Handlers.Login.ByPassword.Result> {
        try {
            const identifierEntity = await this.identifierRepository.findUnique({
                where: { value: identifier },
                options: { populate: ["account.password"] },
            });

            if (identifierEntity?.account?.password) {
                const isValid = await this.hashingService.verify({
                    storedHash: identifierEntity.account.password.hash,
                    value: password,
                });

                if (isValid) {
                    if (identifierEntity.account.is2FAEnforced) {
                        const pendingToken = this.cryptoService.generateToken();
                        await this.pendingAuthCacheService.set({
                            account: identifierEntity.account.id,
                            token: pendingToken,
                        });

                        return { pendingToken, requires2FA: true };
                    } else {
                        return await this.createSession({ account: identifierEntity.account, context });
                    }
                } else {
                    throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_CREDENTIALS`);
                }
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_CREDENTIALS`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async requestOTP({ input: { value } }: Handlers.Login.RequestOTP): Promise<MessageResult> {
        try {
            const identifier = await this.identifierRepository.findUnique({
                where: { value },
            });

            if (!identifier || !identifier.isVerified || !identifier.allowPasswordlessLogin) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.PASSWORDLESS_NOT_AVAILABLE`);
            } else {
                const otp = this.cryptoService.generateOTP();
                await this.otpCacheService.setLogin({ code: otp, identifier: identifier.id });
                if (identifier.type === IdentifierType.EMAIL) {
                    await this.emailService.send({
                        to: identifier.value,
                        subject: "Sign-in code",
                        html: `Your sign-in code: ${otp}`,
                    });
                } else if (identifier.type === IdentifierType.PHONE) {
                    await this.smsService.send({ to: identifier.value, body: `Your sign-in code: ${otp}` });
                }
                return { message: `${this.dictionaryPath}.OTP_SENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async confirmOTP({ input: { code }, context }: Handlers.Login.ConfirmOTP): Promise<Handlers.Login.Session> {
        try {
            const identifier = await this.otpCacheService.getLogin({ code });

            if (identifier) {
                await this.otpCacheService.deleteLogin({ code });

                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier },
                    options: { populate: ["account"] },
                });

                return await this.createSession({ account: identifierEntity.account, context });
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async verify2FA({
        input: { pendingToken, totpCode },
        context,
    }: Handlers.Login.Verify2FA): Promise<Handlers.Login.Session> {
        try {
            const account = await this.pendingAuthCacheService.get({ token: pendingToken });

            if (account) {
                const secondFactor = await this.secondFactorRepository.findUnique({
                    where: { account, type: SecondFactorType.TOTP },
                });

                if (!secondFactor || !secondFactor.confirmedAt) {
                    throw HandlerException.unauthorized(`${this.dictionaryPath}.NO_ACTIVE_2FA`);
                } else {
                    const totp = new TOTP({ secret: secondFactor.secret });
                    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

                    if (isValid) {
                        await this.pendingAuthCacheService.delete({ token: pendingToken });

                        const accountEntity = await this.accountRepository.findUniqueOrThrow({
                            where: { id: account },
                        });

                        return await this.createSession({ account: accountEntity, context });
                    } else {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
                    }
                }
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.EXPIRED_PENDING_AUTH`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private async createSession({ account, context }: Handlers.Login.CreateSession): Promise<Handlers.Login.Session> {
        const writeManager = this.writeManager.fork();

        return await writeManager.transactional(async (transaction) => {
            const refreshToken = this.cryptoService.generateToken();
            const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

            const session = await this.sessionService.create({
                input: {
                    expiresAt: this.sessionService.resolveSessionExpiry(),
                    hash: refreshTokenHash,
                    account,
                },
                context,
                transaction,
            });

            const accessToken = await this.jwtService.signAccessToken({
                sub: account.id,
            });

            return { accessToken, refreshToken, session: session.id };
        });
    }
}
