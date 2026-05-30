import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { FormatResponseInterceptor, PendingTokenInterceptor, AuthTokenInterceptor } from "~common/interceptors";
import { TransactionManagerModule } from "~common/transaction-manager";

import { ElevatedAccessGuard, PermissionGuard, AuthGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { CONTROLLERS } from "./interface/controllers";
import { DOMAIN_SERVICES } from "./domain/services";
import { SCHEDULERS } from "./interface/schedulers";
import { CONSUMERS } from "./interface/consumers";
import { COMMANDS } from "./application/commands";
import { QUERIES } from "./application/queries";
import { QUEUES, BullQueue } from "./infrastructure/queues";

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
        ElevatedAccessGuard,
        PermissionGuard,
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
            useExisting: PermissionGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: ElevatedAccessGuard,
        },
    ],
    controllers: [...CONTROLLERS, ...CONSUMERS],
})
export class IdentityModule {}
