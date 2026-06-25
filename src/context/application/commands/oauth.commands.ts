import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { AUTHORIZATION_REQUEST_CACHE_SERVICE, AUTHORIZATION_CLIENT_SERVICE } from "~context/infrastructure/services";
import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";
import { SESSION_COMMANDS } from "~context/application/commands/tokens";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthCommands implements Commands.OAuth.Contract {
    private readonly dictionaryPath = "commands.oauth";
    private readonly accessTokenTTL: number;

    public constructor(
        private readonly configService: ConfigService,
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.CommandsContract,
        @Inject(AUTHORIZATION_REQUEST_CACHE_SERVICE)
        private readonly authorizationRequestCacheService: InfrastructureServices.AuthorizationRequestCache.Contract,
        @Inject(AUTHORIZATION_CLIENT_SERVICE)
        private readonly authorizationClientService: InfrastructureServices.AuthorizationClient.Contract,
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

        const { id } = await this.authorizationRequestCacheService.create({
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
        if (props.input.grantType !== TokenGrantType.REFRESH_TOKEN) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_GRANT_TYPE` });
        }

        const result = await this.refresh(props);

        return {
            ...result,
            tokenType: "Bearer",
            expiresIn: this.accessTokenTTL,
        };
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
        const request = await this.authorizationRequestCacheService.get({
            id: props.authorizationRequest,
        });

        if (!request || request.account) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }
    }

    public async completeAuthorization(
        props: Commands.OAuth.CompleteAuthorization.Props,
    ): Commands.OAuth.CompleteAuthorization.Result {
        const confirmed = await this.authorizationRequestCacheService.confirm({
            id: props.authorizationRequest,
            account: props.account,
        });

        if (!confirmed) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }
    }
}
