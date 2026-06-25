import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { AUTHORIZATION_CACHE_SERVICE, AUTHORIZATION_CLIENT_SERVICE } from "~context/infrastructure/services";
import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";
import { SESSION_COMMANDS } from "~context/application/commands/tokens";
import { ErrorCode, Exception } from "~common/exceptions";
import { CRYPTO_SERVICE } from "~common/services";

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
        @Inject(AUTHORIZATION_CLIENT_SERVICE)
        private readonly authorizationClientService: InfrastructureServices.AuthorizationClient.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {
        this.accessTokenTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
    }

    public async authorize(props: Commands.OAuth.Authorize.Props): Commands.OAuth.Authorize.Result {
        if (props.input.responseType !== OAuthResponseType.CODE) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_RESPONSE_TYPE` });
        }

        if (props.input.codeChallengeMethod !== CodeChallengeMethod.S256) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_CODE_CHALLENGE_METHOD` });
        }

        const client = this.authorizationClientService.resolve({
            redirectUri: props.input.redirectUri,
            client: props.input.client,
        });

        const { id } = await this.authorizationCacheService.create({
            codeChallengeMethod: props.input.codeChallengeMethod,
            codeChallenge: props.input.codeChallenge,
            redirectUri: props.input.redirectUri,
            state: props.input.state,
            client: client.id,
        });

        const url = new URL(this.authorizationClientService.getLoginUrl());
        url.searchParams.set("auth_request", id);

        return { url: url.toString() };
    }

    public async token(props: Commands.OAuth.Token.Props): Commands.OAuth.Token.Result {
        let result: Awaited<Commands.OAuth.AuthorizationCode.Result | Commands.OAuth.Refresh.Result>;

        if (props.input.grantType === TokenGrantType.AUTHORIZATION_CODE) {
            if (!props.input.code || !props.input.redirectUri || !props.input.codeVerifier) {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.INVALID_GRANT`,
                    code: ErrorCode.INVALID_GRANT,
                });
            }

            result = await this.authorizationCode({
                context: props.context,
                input: {
                    codeVerifier: props.input.codeVerifier,
                    redirectUri: props.input.redirectUri,
                    client: props.input.client,
                    code: props.input.code,
                },
            });
        } else if (props.input.grantType === TokenGrantType.REFRESH_TOKEN) {
            result = await this.refresh(props);
        } else {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.UNSUPPORTED_GRANT_TYPE`,
                code: ErrorCode.UNSUPPORTED_GRANT_TYPE,
            });
        }

        return {
            ...result,
            tokenType: "Bearer",
            expiresIn: this.accessTokenTTL,
        };
    }

    public async authorizationCode(props: Commands.OAuth.AuthorizationCode.Props): Commands.OAuth.AuthorizationCode.Result {
        const authorization = await this.authorizationCacheService.consume({
            code: props.input.code,
        });

        const isValid =
            authorization &&
            authorization.client === props.input.client &&
            authorization.redirectUri === props.input.redirectUri &&
            this.cryptoService.verifyCodeChallenge(props.input.codeVerifier, authorization.codeChallenge);

        if (!isValid) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_GRANT`,
                code: ErrorCode.INVALID_GRANT,
            });
        }

        return this.sessionCommands.create({
            context: props.context,
            input: {
                account: authorization.account,
                client: authorization.client,
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
        });

        if (!issued) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }

        const url = new URL(issued.request.redirectUri);
        url.searchParams.set("state", issued.request.state);
        url.searchParams.set("code", issued.code);

        return { authorizationUrl: url.toString() };
    }
}
