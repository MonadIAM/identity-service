import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class GoogleOAuthService implements CommonServices.GoogleOAuth.Contract {
    private readonly dictionaryPath = "services.oauth.google";

    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly clientId: string;

    private readonly userInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";
    private readonly tokenUrl = "https://oauth2.googleapis.com/token";

    public constructor(private readonly configService: ConfigService) {
        this.clientId = this.configService.getOrThrow<string>("OAUTH_GOOGLE_CLIENT_ID");
        this.clientSecret = this.configService.getOrThrow<string>("OAUTH_GOOGLE_CLIENT_SECRET");
        this.redirectUri = this.configService.getOrThrow<string>("OAUTH_GOOGLE_REDIRECT_URI");
    }

    public getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
            redirect_uri: this.redirectUri,
            scope: "openid email profile",
            client_id: this.clientId,
            access_type: "offline",
            response_type: "code",
            state,
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    public async exchangeCode(code: string): Promise<CommonServices.GoogleOAuth.TokenResponse> {
        const response = await fetch(this.tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: "authorization_code",
                code,
            }),
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw Exception.externalAuthnFailed({ messageKey: `${this.dictionaryPath}.CODE_EXCHANGE_FAILED` });
        }
    }

    public async fetchProfile(accessToken: string): Promise<CommonServices.GoogleOAuth.Profile> {
        const response = await fetch(this.userInfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
            const data = await response.json();

            return {
                emailVerified: Boolean(data.email_verified),
                displayName: data.name ?? data.email,
                providerUserId: data.sub,
                pictureUrl: data.picture,
                email: data.email,
            };
        } else {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.SERVICE_UNAVAILABLE` });
        }
    }
}
