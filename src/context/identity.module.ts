import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { FormatResponseInterceptor, PendingTokenInterceptor, AuthTokenInterceptor } from "~common/interceptors";
import { TrackingModule } from "~common/tracking";

import { ElevatedAccessGuard, AuthGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { PROCESSORS } from "./infrastructure/processors";
import { CONTROLLERS } from "./interface/controllers";
import { DOMAIN_SERVICES } from "./domain/services";
import { SCHEDULERS } from "./interface/schedulers";
import { HANDLERS } from "./application/handlers";
import { COMMANDS } from "./application/commands";

@Module({
    imports: [TrackingModule, BullModule.registerQueue({ name: "cleanup" })],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...REPOSITORIES,
        ...SCHEDULERS,
        ...PROCESSORS,
        ...HANDLERS,
        ...COMMANDS,
        ElevatedAccessGuard,
        AuthGuard,
        {
            provide: APP_INTERCEPTOR,
            useClass: FormatResponseInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PendingTokenInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuthTokenInterceptor,
        },
        {
            provide: APP_GUARD,
            useExisting: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: ElevatedAccessGuard,
        },
    ],
    controllers: [...CONTROLLERS],
})
export class IdentityModule {}
