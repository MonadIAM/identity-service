import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class GitHubOAuthService implements CommonServices.GitHubOAuth.Contract {
    private readonly dictionaryPath = "services.oauth.github";

    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly clientId: string;

    private readonly tokenUrl = "https://github.com/login/oauth/access_token";
    private readonly authnUrl = "https://github.com/login/oauth/authorize";
    private readonly emailsUrl = "https://api.github.com/user/emails";
    private readonly userUrl = "https://api.github.com/user";

    public constructor(private readonly configService: ConfigService) {
        this.clientSecret = this.configService.getOrThrow<string>("OAUTH_GITHUB_CLIENT_SECRET");
        this.redirectUri = this.configService.getOrThrow<string>("OAUTH_GITHUB_REDIRECT_URI");
        this.clientId = this.configService.getOrThrow<string>("OAUTH_GITHUB_CLIENT_ID");
    }

    public getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
            redirect_uri: this.redirectUri,
            scope: "read:user user:email",
            client_id: this.clientId,
            state,
        });

        return `${this.authnUrl}?${params.toString()}`;
    }

    public async exchangeCode(code: string): Promise<CommonServices.GitHubOAuth.TokenResponse> {
        const response = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                code,
            }),
        }).catch((cause) => {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.CODE_EXCHANGE_FAILED`, cause });
        });

        if (response.ok) {
            const data = await response.json();

            if (data.error) {
                throw Exception.externalAuthnFailed({ messageKey: `${this.dictionaryPath}.CODE_EXCHANGE_FAILED` });
            } else {
                return data;
            }
        } else {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.CODE_EXCHANGE_FAILED` });
        }
    }

    public async fetchProfile(accessToken: string): Promise<CommonServices.GitHubOAuth.Profile> {
        const [user, email] = await Promise.all([this.fetchUser(accessToken), this.fetchPrimaryEmail(accessToken)]);

        return {
            displayName: user.name ?? user.login,
            providerUserId: String(user.id),
            emailVerified: Boolean(email),
            pictureUrl: user.avatar_url,
            email,
        };
    }

    private async fetchUser(accessToken: string): Promise<CommonServices.GitHubOAuth.UserResponse> {
        const response = await fetch(this.userUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
            },
        }).catch((cause) => {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.PROFILE_FETCH_FAILED`, cause });
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.PROFILE_FETCH_FAILED` });
        }
    }

    private async fetchPrimaryEmail(accessToken: string): Promise<Optional<string>> {
        const response = await fetch(this.emailsUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
            },
        }).catch((cause) => {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.PROFILE_FETCH_FAILED`, cause });
        });

        if (response.ok) {
            const emails: CommonServices.GitHubOAuth.EmailEntry[] = await response.json();
            const primary = emails.find((entry) => entry.primary && entry.verified);
            return primary?.email;
        } else {
            return undefined;
        }
    }
}
