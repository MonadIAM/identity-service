import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { InvalidationScope, KafkaTopic } from "@liam/contracts";

import { ACCESS_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KAFKA_SERVICE } from "~infrastructure/kafka";

@Controller()
export class AccessCacheInvalidationConsumer implements Consumers.AccessCacheInvalidation.Contract, OnModuleInit {
    public constructor(
        @Inject(ACCESS_CACHE_SERVICE)
        private readonly accessCacheService: InfrastructureServices.AccessCache.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.ACCESS_CACHE_INVALIDATION)
    public async handle(
        @Payload() payload: Consumers.AccessCacheInvalidation.Handle.Props,
    ): Consumers.AccessCacheInvalidation.Handle.Result {
        try {
            for await (const item of payload.items) {
                switch (item.scope) {
                    case InvalidationScope.ACCOUNT_REALM:
                        await this.accessCacheService.delete(item);
                        break;
                    case InvalidationScope.ACCOUNT:
                        await this.accessCacheService.deleteAccount(item);
                        break;
                    case InvalidationScope.REALM:
                        await this.accessCacheService.deleteRealm(item);
                        break;
                    case InvalidationScope.GLOBAL:
                        await this.accessCacheService.deleteAll();
                        break;
                }
            }
        } catch (error) {
            this.kafkaClient.emit(KafkaTopic.ACCESS_CACHE_INVALIDATION_DLQ, {
                timestamp: new Date().toISOString(),
                originalTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                error: String(error),
                retryCount: 0,
                payload,
            });
        }
    }
}
