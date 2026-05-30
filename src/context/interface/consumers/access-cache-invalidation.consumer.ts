import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { InvalidationScope, KafkaTopic } from "@liam/contracts";
import { lastValueFrom } from "rxjs";

import { ACCESS_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { RetryableException } from "~common/exceptions";

@Controller()
export class AccessCacheInvalidationConsumer implements Consumers.AccessCacheInvalidation.Contract, OnModuleInit {
    private readonly logger = new Logger(AccessCacheInvalidationConsumer.name);

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
        @Payload() payload: Consumers.AccessCacheInvalidation.Payload,
        @Ctx() context: KafkaContext,
    ): Promise<void> {
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
            if (RetryableException.is(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCESS_CACHE_INVALIDATION_RETRY, {
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                        value: {
                            originalTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                            error: String(error),
                            payload,
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in access cache invalidation consumer: ${String(error)}`);
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCESS_CACHE_INVALIDATION_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.ACCESS_CACHE_INVALIDATION,
                            error: String(error),
                            payload,
                        },
                    }),
                );
            }
        }
    }
}
