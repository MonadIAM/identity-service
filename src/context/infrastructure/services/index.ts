import { Provider } from "@nestjs/common";

import { OAuthStateCacheService } from "./oauth-state-cache.service";
import { OTPCacheService } from "./otp-cache.service";

export const OAUTH_STATE_CACHE_SERVICE = Symbol("InfrastructureServices.OAuthStateCache.Contract");
export const OTP_CACHE_SERVICE = Symbol("InfrastructureServices.OTPCache.Contract");

export const INFRASTRUCTURE_SERVICES: Provider[] = [
    {
        provide: OAUTH_STATE_CACHE_SERVICE,
        useClass: OAuthStateCacheService,
    },
    {
        provide: OTP_CACHE_SERVICE,
        useClass: OTPCacheService,
    },
];
