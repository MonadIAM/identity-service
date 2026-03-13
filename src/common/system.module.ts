import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RateLimiterModule } from "./rate-limiter";
import { COMMON_SERVICES } from "./services";
import { validateEnv } from "./validator";
import { BullMQModule } from "./bullmq";
import { I18nModule } from "./i18n";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        RateLimiterModule,
        BullMQModule,
        I18nModule,
    ],
    exports: [...COMMON_SERVICES, ConfigModule, RateLimiterModule, I18nModule],
    providers: [...COMMON_SERVICES],
})
export class SystemModule {}
