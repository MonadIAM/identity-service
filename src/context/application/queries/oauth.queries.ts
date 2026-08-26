import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType, IdentifierType, OidcScope } from "~context/enums";
import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { JWT_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthQueries implements Queries.OAuth.Contract {
    private readonly dictionaryPath = "commands.oauth";
    private readonly issuer: string;
    private readonly apiBaseUrl: URL;

    public constructor(
        configService: ConfigService,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.QueryContract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.PublicContract,
    ) {
        this.issuer = configService.getOrThrow<string>("JWT_ISSUER");

        const issuerUrl = new URL(this.issuer);
        const version = configService.getOrThrow<number>("API_VERSION");

        this.apiBaseUrl = new URL(`/api/v${version}/`, issuerUrl);
    }

    public getAuthorizationServerMetadata(): Queries.OAuth.AuthorizationServerMetadata.Result {
        return {
            grantTypesSupported: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
            authorizationEndpoint: new URL("oauth/authorize", this.apiBaseUrl).toString(),
            revocationEndpoint: new URL("oauth/revoke", this.apiBaseUrl).toString(),
            jwksURI: new URL(".well-known/jwks.json", this.apiBaseUrl).toString(),
            tokenEndpoint: new URL("oauth/token", this.apiBaseUrl).toString(),
            codeChallengeMethodsSupported: [CodeChallengeMethod.S256],
            responseTypesSupported: [OAuthResponseType.CODE],
            tokenEndpointAuthMethodsSupported: ["none"],
            scopesSupported: Object.values(OidcScope),
            issuer: this.issuer,
        };
    }

    public getOpenIdConfiguration(): Queries.OAuth.OpenIdConfiguration.Result {
        return {
            ...this.getAuthorizationServerMetadata(),
            endSessionEndpoint: new URL("oauth/logout", this.apiBaseUrl).toString(),
            userinfoEndpoint: new URL("oauth/userinfo", this.apiBaseUrl).toString(),
            idTokenSigningAlgValuesSupported: ["ES256"],
            subjectTypesSupported: ["pairwise"],
            claimsSupported: [
                "email_verified",
                "updated_at",
                "auth_time",
                "zoneinfo",
                "picture",
                "locale",
                "email",
                "name",
                "acr",
                "sub",
            ],
        };
    }

    public async getUserInfo(props: Queries.OAuth.UserInfo.Props): Queries.OAuth.UserInfo.Result {
        const scopes = props.scope.split(" ");

        if (scopes.includes(OidcScope.OPENID)) {
            const account = await this.accountRepository.findUniqueOrThrow({
                options: { populate: ["profile", "identifiers"] },
                where: { id: props.account },
            });

            const sub = await this.jwtService.computePairwiseSubject({ account: account.id, client: props.client });
            const claims: Awaited<Queries.OAuth.UserInfo.Result> = { sub };

            if (scopes.includes(OidcScope.PROFILE) && account.profile) {
                claims.picture = account.profile.pictureUrl;
                claims.zoneinfo = account.profile.timeZone;
                claims.name = account.profile.displayName;
                claims.locale = account.profile.locale;
                claims.updatedAt = account.profile.updatedAt
                    ? Math.floor(account.profile.updatedAt.getTime() / 1e3)
                    : undefined;
            }

            if (scopes.includes(OidcScope.EMAIL)) {
                const email = account.identifiers.getItems().find((identifier) => identifier.type === IdentifierType.EMAIL);

                if (email) {
                    claims.email = email.identity;
                    claims.emailVerified = email.isVerified;
                }
            }

            return claims;
        } else {
            throw Exception.forbidden({
                messageKey: `${this.dictionaryPath}.INSUFFICIENT_SCOPE`,
                headers: {
                    "WWW-Authenticate":
                        'Bearer error="insufficient_scope", error_description="This access token was not issued with the openid scope"',
                },
            });
        }
    }
}
