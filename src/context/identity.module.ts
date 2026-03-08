import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";
import { DOMAIN_SERVICES } from "./domain/services";

@Module({
    providers: [...REPOSITORIES, ...DOMAIN_SERVICES],
})
export class IdentityModule {}
