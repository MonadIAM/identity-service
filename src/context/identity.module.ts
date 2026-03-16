import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { CONTROLLERS } from "./interface/controllers";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { PROCESSORS } from "./infrastructure/processors";
import { DOMAIN_SERVICES } from "./domain/services";
import { SCHEDULERS } from "./interface/schedulers";
import { HANDLERS } from "./application/handlers";

@Module({
    imports: [BullModule.registerQueue({ name: "cleanup" })],
    providers: [...INFRASTRUCTURE_SERVICES, ...DOMAIN_SERVICES, ...REPOSITORIES, ...SCHEDULERS, ...PROCESSORS, ...HANDLERS],
    controllers: [...CONTROLLERS],
})
export class IdentityModule {}
