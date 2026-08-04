import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Global, Module } from "@nestjs/common";

import { MikroOrmConfig } from "./database.config";

@Global()
@Module({
    imports: [
        ConfigModule,
        MikroOrmModule.forRootAsync({
            contextName: "write",
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                ...MikroOrmConfig.buildOptions({ kind: "write", config }),
                registerRequestContext: false,
                autoLoadEntities: true,
            }),
        }),

        MikroOrmModule.forRootAsync({
            contextName: "read",
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const cqrsEnabled = config.getOrThrow<string>("POSTGRES_CQRS_ENABLED") === "true";
                if (cqrsEnabled) {
                    return {
                        ...MikroOrmConfig.buildOptions({ kind: "read", config }),
                        registerRequestContext: false,
                        autoLoadEntities: true,
                    };
                } else {
                    return {
                        ...MikroOrmConfig.buildOptions({ kind: "write", config }),
                        registerRequestContext: false,
                        autoLoadEntities: true,
                    };
                }
            },
        }),
    ],
})
export class DatabaseModule {}
