import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AuthorizationClientService implements InfrastructureServices.AuthorizationClient.Contract {
    private readonly dictionaryPath = "services.authorization-client";

    private readonly client: InfrastructureServices.AuthorizationClient.Client;
    private readonly loginUrl: string;

    public constructor(private readonly configService: ConfigService) {
        this.loginUrl = this.configService.getOrThrow<string>("AUTHORIZATION_LOGIN_URL");
        this.client = {
            redirectUris: JSON.parse(this.configService.getOrThrow<string>("AUTHORIZATION_REDIRECT_URIS")),
            id: this.configService.getOrThrow<string>("AUTHORIZATION_CLIENT_ID"),
            allowedGrants: ["authorization_code", "refresh_token"],
            requirePKCE: true,
            public: true,
        };
    }

    public getLoginUrl(): string {
        return this.loginUrl;
    }

    public resolve(
        props: InfrastructureServices.AuthorizationClient.Resolve.Props,
    ): InfrastructureServices.AuthorizationClient.Resolve.Result {
        if (props.client !== this.client.id) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_CLIENT` });
        }

        if (!this.client.redirectUris.includes(props.redirectUri)) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_REDIRECT_URI` });
        }

        return this.client;
    }
}
