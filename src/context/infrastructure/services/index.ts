import { Provider } from "@nestjs/common";

import { ElevatedAccessCacheService } from "./elevated-access-cache.service";
import { PendingAuthCacheService } from "./pending-auth-cache.service";
import { OAuthStateCacheService } from "./oauth-state-cache.service";
import { OTPCacheService } from "./otp-cache.service";

export const ELEVATED_ACCESS_CACHE_SERVICE = Symbol("InfrastructureServices.ElevatedAccessCache.Contract");
export const PENDING_AUTH_CACHE_SERVICE = Symbol("InfrastructureServices.PendingAuthCache.Contract");
export const OAUTH_STATE_CACHE_SERVICE = Symbol("InfrastructureServices.OAuthStateCache.Contract");
export const OTP_CACHE_SERVICE = Symbol("InfrastructureServices.OTPCache.Contract");

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
        provide: OTP_CACHE_SERVICE,
        useClass: OTPCacheService,
    },
];
