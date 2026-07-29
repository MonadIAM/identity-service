import { Inject, Injectable, HttpStatus, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import { JWTPayload } from "jose";

import { AUTHORIZATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { INTERFACE_CLIENT_REPOSITORY } from "~context/domain/repositories";
import { DEFAULT_OAUTH_SCOPE, SYSTEM_REALM_ID } from "~context/constants";
import { SESSION_COMMANDS } from "~context/interface/commands";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { ErrorCode, Exception } from "~common/exceptions";
import { TokenGrantType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthCommands implements Commands.OAuth.Contract {
    private readonly dictionaryPath = "commands.oauth";
    private readonly accessTokenTTL: number;

    public constructor(
        private readonly configService: ConfigService,
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.CommandsContract,
        @Inject(AUTHORIZATION_CACHE_SERVICE)
        private readonly authorizationCacheService: InfrastructureServices.AuthorizationCache.Contract,
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {
        this.accessTokenTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
    }

    public async authorize(props: Commands.OAuth.Authorize.Props): Commands.OAuth.Authorize.Result {
        const client = await this.interfaceClientRepository.findUniqueOrThrow({ where: { id: props.input.client } });

        if (client.isRevoked) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.CLIENT_REVOKED`,
                code: ErrorCode.INVALID_CLIENT,
            });
        }

        if (client.isApplicationRevoked) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.CLIENT_APPLICATION_REVOKED`,
                code: ErrorCode.INVALID_CLIENT,
            });
        }

        if (client.redirectUri !== props.input.redirectUri) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_REDIRECT_URI`,
                code: ErrorCode.INVALID_REQUEST,
            });
        }

        const { id } = await this.authorizationCacheService.create({
            codeChallengeMethod: props.input.codeChallengeMethod,
            scope: props.input.scope ?? DEFAULT_OAUTH_SCOPE,
            codeChallenge: props.input.codeChallenge,
            redirectUri: props.input.redirectUri,
            nonce: props.input.nonce,
            state: props.input.state,
            client: client.id,
        });

        const url = new URL(client.authAddress);
        url.searchParams.set("authorizationRequest", id);

        return { url: url.toString() };
    }

    public async token(props: Commands.OAuth.Token.Props): Commands.OAuth.Token.Result {
        let result: Awaited<Commands.OAuth.AuthorizationCode.Result | Commands.OAuth.Refresh.Result>;

        if (props.input.grantType === TokenGrantType.AUTHORIZATION_CODE) {
            result = await this.authorizationCode({
                context: props.context,
                input: {
                    grantType: TokenGrantType.AUTHORIZATION_CODE,
                    codeVerifier: props.input.codeVerifier,
                    redirectUri: props.input.redirectUri,
                    client: props.input.client,
                    code: props.input.code,
                },
            });
        } else {
            const client = await this.interfaceClientRepository.findUniqueOrThrow({ where: { id: props.input.client } });

            if (client.isRevoked) {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.CLIENT_REVOKED`,
                    code: ErrorCode.INVALID_CLIENT,
                });
            }

            if (client.isApplicationRevoked) {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.CLIENT_APPLICATION_REVOKED`,
                    code: ErrorCode.INVALID_CLIENT,
                });
            }

            result = await this.refresh({
                context: props.context,
                input: {
                    grantType: TokenGrantType.REFRESH_TOKEN,
                    refreshToken: props.input.refreshToken,
                    client: props.input.client,
                },
            });
        }

        return {
            ...result,
            tokenType: "Bearer",
            expiresIn: this.accessTokenTTL,
        };
    }

    public async authorizationCode(props: Commands.OAuth.AuthorizationCode.Props): Commands.OAuth.AuthorizationCode.Result {
        const client = await this.interfaceClientRepository.findUniqueOrThrow({
            options: { populate: ["application"] },
            where: { id: props.input.client },
        });

        if (client.isRevoked) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.CLIENT_REVOKED`,
                code: ErrorCode.INVALID_CLIENT,
            });
        }

        if (client.isApplicationRevoked) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.CLIENT_APPLICATION_REVOKED`,
                code: ErrorCode.INVALID_CLIENT,
            });
        }

        if (client.redirectUri !== props.input.redirectUri) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_REDIRECT_URI`,
                code: ErrorCode.INVALID_REQUEST,
            });
        }

        const authorization = await this.authorizationCacheService.consume({
            code: props.input.code,
        });

        if (
            authorization?.client !== client.id ||
            authorization.redirectUri !== props.input.redirectUri ||
            !this.cryptoService.verifyCodeChallenge(props.input.codeVerifier, authorization.codeChallenge)
        ) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_GRANT`,
                code: ErrorCode.INVALID_GRANT,
            });
        }

        return this.sessionCommands.create({
            context: props.context,
            input: {
                realms: Array.from(new Set([SYSTEM_REALM_ID, client.application.realm])),
                account: authorization.account,
                client: authorization.client,
                scope: authorization.scope,
                nonce: authorization.nonce,
                acr: authorization.acr,
            },
        });
    }

    public refresh(props: Commands.OAuth.Refresh.Props): Commands.OAuth.Refresh.Result {
        return this.sessionCommands.refresh({
            context: props.context,
            input: {
                refreshToken: props.input.refreshToken,
                client: props.input.client,
            },
        });
    }

    public async revoke(props: Commands.OAuth.Revoke.Props): Commands.OAuth.Revoke.Result {
        const { refreshToken, client, context } = props;

        if (refreshToken) {
            const clientEntity = await this.interfaceClientRepository.findUniqueOrThrow({ where: { id: client } });

            if (clientEntity.isRevoked) {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.CLIENT_REVOKED`,
                    code: ErrorCode.INVALID_CLIENT,
                });
            }

            if (clientEntity.isApplicationRevoked) {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.CLIENT_APPLICATION_REVOKED`,
                    code: ErrorCode.INVALID_CLIENT,
                });
            }

            const payload: Nullable<JWTPayload> = await this.jwtService.verifyRefresh(refreshToken).catch(() => null);

            if (payload?.client_id === client) {
                await this.sessionCommands.revoke({
                    session: payload.sid as string,
                    actor: payload.sub as string,
                    input: { refreshToken },
                    context,
                });
            }
        }
    }

    public async endSession(props: Commands.OAuth.EndSession.Props): Commands.OAuth.EndSession.Result {
        const { response, context, input } = props;
        const payload = await this.jwtService.verifyIdToken(input.idTokenHint);

        await this.sessionCommands.revoke({
            session: payload.sid as string,
            actor: payload.sub as string,
            input: {},
            context,
        });

        if (input.postLogoutRedirectUri) {
            const client = await this.interfaceClientRepository.findUnique({ where: { id: payload.aud as string } });

            if (client?.redirectUri === input.postLogoutRedirectUri) {
                const url = new URL(client.redirectUri);

                if (input.state) {
                    url.searchParams.set("state", input.state);
                }

                response.redirect(url.toString(), HttpStatus.FOUND);
            }
        }
    }

    public async assertAuthorizationPending(
        props: Commands.OAuth.AssertAuthorizationPending.Props,
    ): Commands.OAuth.AssertAuthorizationPending.Result {
        const request = await this.authorizationCacheService.get({
            id: props.authorizationRequest,
        });

        if (!request) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }
    }

    public async completeAuthorization(
        props: Commands.OAuth.CompleteAuthorization.Props,
    ): Commands.OAuth.CompleteAuthorization.Result {
        const issued = await this.authorizationCacheService.issue({
            authorizationRequest: props.authorizationRequest,
            account: props.account,
            acr: props.acr,
        });

        if (issued) {
            const url = new URL(issued.request.redirectUri);
            url.searchParams.set("state", issued.request.state);
            url.searchParams.set("code", issued.code);

            return { authorizationUrl: url.toString() };
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }
    }
}
