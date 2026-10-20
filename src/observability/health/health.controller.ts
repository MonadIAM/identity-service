import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { HealthCheck } from "@nestjs/terminus";

import { Public, SkipInterceptors } from "~common/decorators";

import { HealthService } from "./health.service";

@SkipThrottle()
@ApiTags("Health")
@SkipInterceptors()
@Controller("health")
export class HealthController {
    public constructor(private readonly healthService: HealthService) {}

    @Public()
    @HealthCheck()
    @Get("liveness")
    @ApiOperation({
        summary: "Get liveness status",
        description: "Confirms that the service process is running.",
    })
    public liveness(): Health.Liveness {
        return this.healthService.liveness();
    }

    @Public()
    @HealthCheck()
    @Get("readiness")
    @ApiOperation({
        summary: "Get readiness status",
        description: "Checks database, Redis, and Kafka availability, returning per-component readiness status.",
    })
    public readiness(): Promise<Health.Readiness> {
        return this.healthService.readiness();
    }
}
