import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";
import { PROCESSORS } from "./infrastructure/processors";
import { DOMAIN_SERVICES } from "./domain/services";
import { SCHEDULERS } from "./interface/schedulers";

@Module({
    imports: [BullModule.registerQueue({ name: "cleanup" })],
    providers: [...REPOSITORIES, ...SCHEDULERS, ...PROCESSORS, ...DOMAIN_SERVICES],
})
export class IdentityModule {}
