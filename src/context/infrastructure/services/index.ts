import { Provider } from "@nestjs/common";

import { ElevatedAccessCacheService } from "./elevated-access-cache.service";
import { PendingAuthCacheService } from "./pending-auth-cache.service";
import { OAuthStateCacheService } from "./oauth-state-cache.service";
import { BlacklistCacheService } from "./blacklist-cache.service";
import { AccessCacheService } from "./access-cache.service";
import { OTPCacheService } from "./otp-cache.service";
import {
    ELEVATED_ACCESS_CACHE_SERVICE,
    PENDING_AUTH_CACHE_SERVICE,
    OAUTH_STATE_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    ACCESS_CACHE_SERVICE,
    OTP_CACHE_SERVICE,
} from "./tokens";

export const INFRASTRUCTURE_SERVICES: Provider[] = [
    {
        provide: ELEVATED_ACCESS_CACHE_SERVICE,
        useClass: ElevatedAccessCacheService,
    },
    {
        provide: PENDING_AUTH_CACHE_SERVICE,
        useClass: PendingAuthCacheService,
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
        provide: ACCESS_CACHE_SERVICE,
        useClass: AccessCacheService,
    },
    {
        provide: OTP_CACHE_SERVICE,
        useClass: OTPCacheService,
    },
];

export {
    ELEVATED_ACCESS_CACHE_SERVICE,
    PENDING_AUTH_CACHE_SERVICE,
    OAUTH_STATE_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    ACCESS_CACHE_SERVICE,
    OTP_CACHE_SERVICE,
};
