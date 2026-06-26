import { ClassProvider } from "@nestjs/common";

import { ReauthenticationCacheService } from "./reauthentication-cache.service";
import { SecondFactorSecretService } from "./second-factor-secret.service";
import { AuthorizationCacheService } from "./authorization-cache.service";
import { Pending2FACacheService } from "./pending-2fa-cache.service";
import { OAuthStateCacheService } from "./oauth-state-cache.service";
import { BlacklistCacheService } from "./blacklist-cache.service";
import { ScriptExecutorService } from "./script-executor.service";
import { ScriptLoaderService } from "./script-loader.service";
import { AccessCacheService } from "./access-cache.service";
import { OTPCacheService } from "./otp-cache.service";
import {
    REAUTHENTICATION_CACHE_SERVICE,
    SECOND_FACTOR_SECRET_SERVICE,
    AUTHORIZATION_CACHE_SERVICE,
    PENDING_2FA_CACHE_SERVICE,
    OAUTH_STATE_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
    ACCESS_CACHE_SERVICE,
    OTP_CACHE_SERVICE,
} from "./tokens";

export const INFRASTRUCTURE_SERVICES: ClassProvider[] = [
    {
        provide: REAUTHENTICATION_CACHE_SERVICE,
        useClass: ReauthenticationCacheService,
    },
    {
        provide: SECOND_FACTOR_SECRET_SERVICE,
        useClass: SecondFactorSecretService,
    },
    {
        provide: AUTHORIZATION_CACHE_SERVICE,
        useClass: AuthorizationCacheService,
    },
    {
        provide: PENDING_2FA_CACHE_SERVICE,
        useClass: Pending2FACacheService,
    },
    {
        provide: OAUTH_STATE_CACHE_SERVICE,
        useClass: OAuthStateCacheService,
    },
    {
        provide: BLACKLIST_CACHE_SERVICE,
        useClass: BlacklistCacheService,
    },
    {
        provide: SCRIPT_EXECUTOR_SERVICE,
        useClass: ScriptExecutorService,
    },
    {
        provide: SCRIPT_LOADER_SERVICE,
        useClass: ScriptLoaderService,
    },
    {
        provide: ACCESS_CACHE_SERVICE,
        useClass: AccessCacheService,
    },
    {
        provide: OTP_CACHE_SERVICE,
        useClass: OTPCacheService,
    },
];

export {
    REAUTHENTICATION_CACHE_SERVICE,
    SECOND_FACTOR_SECRET_SERVICE,
    AUTHORIZATION_CACHE_SERVICE,
    PENDING_2FA_CACHE_SERVICE,
    OAUTH_STATE_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
    ACCESS_CACHE_SERVICE,
    OTP_CACHE_SERVICE,
};
