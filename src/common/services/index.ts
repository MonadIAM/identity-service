import { Provider } from "@nestjs/common";

import { GoogleOAuthService } from "./google-oauth.service";
import { GitHubOAuthService } from "./github-oauth.service";
import { HashingService } from "./hashing.service";
import { CryptoService } from "./crypto.service";
import { EmailService } from "./email.service";
import { SMSService } from "./sms.service";
import { JWTService } from "./jwt.service";

export const GOOGLE_OAUTH_SERVICE = Symbol("Services.GoogleOAuth.Contract");
export const GITHUB_OAUTH_SERVICE = Symbol("Services.GitHubOAuth.Contract");
export const HASHING_SERVICE = Symbol("Services.Hashing.Contract");
export const CRYPTO_SERVICE = Symbol("Services.Crypto.Contract");
export const EMAIL_SERVICE = Symbol("Services.Email.Contract");
export const SMS_SERVICE = Symbol("Services.SMS.Contract");
export const JWT_SERVICE = Symbol("Services.JWT.Contract");

export const COMMON_SERVICES: Provider[] = [
    {
        provide: GOOGLE_OAUTH_SERVICE,
        useClass: GoogleOAuthService,
    },
    {
        provide: GITHUB_OAUTH_SERVICE,
        useClass: GitHubOAuthService,
    },
    {
        provide: HASHING_SERVICE,
        useClass: HashingService,
    },
    {
        provide: CRYPTO_SERVICE,
        useClass: CryptoService,
    },
    {
        provide: EMAIL_SERVICE,
        useClass: EmailService,
    },
    {
        provide: SMS_SERVICE,
        useClass: SMSService,
    },
    {
        provide: JWT_SERVICE,
        useClass: JWTService,
    },
];
