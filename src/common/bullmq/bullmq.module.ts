import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.getOrThrow<string>("REDIS_HOST"),
                    password: config.getOrThrow<string>("REDIS_PASSWORD"),
                    db: Number(config.getOrThrow<string>("REDIS_DB_QUEUE")),
                    port: Number(config.getOrThrow<string>("REDIS_PORT")),
                },
            }),
        }),
    ],
})
export class BullMQModule {}
