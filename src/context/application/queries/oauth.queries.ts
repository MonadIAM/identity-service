import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthQueries implements Queries.OAuth.Contract {
    private readonly issuer: string;
    private readonly apiBaseUrl: URL;

    public constructor(configService: ConfigService) {
        this.issuer = configService.getOrThrow<string>("JWT_ISSUER");

        const issuerUrl = new URL(this.issuer);
        const version = configService.getOrThrow<number>("API_VERSION");

        this.apiBaseUrl = new URL(`/api/v${version}/`, issuerUrl);
    }

    public getAuthorizationServerMetadata(): Queries.OAuth.AuthorizationServerMetadata.Result {
        return {
            grantTypesSupported: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
            authorizationEndpoint: new URL("oauth/authorize", this.apiBaseUrl).toString(),
            jwksUri: new URL(".well-known/jwks.json", this.apiBaseUrl).toString(),
            tokenEndpoint: new URL("oauth/token", this.apiBaseUrl).toString(),
            codeChallengeMethodsSupported: [CodeChallengeMethod.S256],
            responseTypesSupported: [OAuthResponseType.CODE],
            tokenEndpointAuthMethodsSupported: ["none"],
            issuer: this.issuer,
        };
    }
}
