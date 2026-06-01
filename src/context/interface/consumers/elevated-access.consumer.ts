import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { ELEVATED_ACCESS_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ElevatedAccessConsumer implements Consumers.ElevatedAccess.Contract, OnModuleInit {
    public constructor(
        @Inject(ELEVATED_ACCESS_CACHE_SERVICE)
        private readonly elevatedAccessCacheService: InfrastructureServices.ElevatedAccessCache.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.ELEVATED_ACCESS)
    public async handle(@Payload() message: Consumers.ElevatedAccess.Payload): Promise<void> {
        try {
            await this.elevatedAccessCacheService.set({
                session: message.payload.session,
                ttl: message.payload.ttl,
            });
        } catch (error) {
            await lastValueFrom(
                this.kafkaClient.emit(KafkaTopic.ELEVATED_ACCESS_RETRY, {
                    value: {
                        originalTopic: KafkaTopic.ELEVATED_ACCESS,
                        error: String(error),
                        payload: message,
                    },
                }),
            );
        }
    }
}
