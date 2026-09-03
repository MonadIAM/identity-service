import { ClassProvider } from "@nestjs/common";

import { VaultTransitService } from "./vault-transit.service";
import { GoogleOAuthService } from "./google-oauth.service";
import { GitHubOAuthService } from "./github-oauth.service";
import { HashingService } from "./hashing.service";
import { CryptoService } from "./crypto.service";
import { TOTPService } from "./totp.service";
import { JWTService } from "./jwt.service";
import {
    VAULT_TRANSIT_SERVICE,
    GOOGLE_OAUTH_SERVICE,
    GITHUB_OAUTH_SERVICE,
    HASHING_SERVICE,
    CRYPTO_SERVICE,
    TOTP_SERVICE,
    JWT_SERVICE,
} from "./tokens";

export const COMMON_SERVICES: ClassProvider[] = [
    {
        provide: VAULT_TRANSIT_SERVICE,
        useClass: VaultTransitService,
    },
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
        provide: TOTP_SERVICE,
        useClass: TOTPService,
    },
    {
        provide: JWT_SERVICE,
        useClass: JWTService,
    },
];

export {
    VAULT_TRANSIT_SERVICE,
    GOOGLE_OAUTH_SERVICE,
    GITHUB_OAUTH_SERVICE,
    HASHING_SERVICE,
    CRYPTO_SERVICE,
    TOTP_SERVICE,
    JWT_SERVICE,
};
