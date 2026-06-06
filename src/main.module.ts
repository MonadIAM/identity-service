import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { IdentityModule } from "~context/identity.module";
import { InfrastructureModule } from "~infrastructure";
import { ObservabilityModule } from "~observability";
import { ExceptionFilter } from "~common/exceptions";
import { SystemModule } from "~common/system.module";

@Module({
    imports: [SystemModule, InfrastructureModule, ObservabilityModule, IdentityModule],
    providers: [
        {
            provide: APP_FILTER,
            useClass: ExceptionFilter,
        },
    ],
})
export class MainModule {}
