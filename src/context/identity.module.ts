import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { FormatResponseInterceptor, PendingTokenInterceptor, AuthnTokenInterceptor } from "~common/interceptors";
import { TransactionManagerModule } from "~common/transaction-manager";

import { ReauthenticationGuard, PermissionGuard, AuthnGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { QUEUES, BullQueue } from "./infrastructure/queues";
import { HTTP_CONTROLLERS } from "./interface/controllers";
import { DOMAIN_SERVICES } from "./domain/services";
import { SCHEDULERS } from "./interface/schedulers";
import { CONSUMERS } from "./interface/consumers";
import { COMMANDS } from "./application/commands";
import { QUERIES } from "./application/queries";

@Module({
    imports: [
        TransactionManagerModule,
        BullModule.registerQueue({ name: BullQueue.CLEANUP }, { name: BullQueue.KAFKA_RETRY }),
    ],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...REPOSITORIES,
        ...SCHEDULERS,
        ...COMMANDS,
        ...QUERIES,
        ...QUEUES,
        ReauthenticationGuard,
        PermissionGuard,
        AuthnGuard,
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
            useClass: AuthnTokenInterceptor,
        },
        {
            provide: APP_GUARD,
            useExisting: AuthnGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: PermissionGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: ReauthenticationGuard,
        },
    ],
    controllers: [...HTTP_CONTROLLERS, ...CONSUMERS],
})
export class IdentityModule {}
