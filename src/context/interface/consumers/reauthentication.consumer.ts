import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { REAUTHENTICATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ReauthenticationConsumer implements Consumers.Reauthentication.Contract, OnModuleInit {
    private readonly logger = new Logger(ReauthenticationConsumer.name);

    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_REGISTRY)
        private readonly retryRegistry: Kafka.RetryRegistry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();

        this.retryRegistry.register({
            topic: KafkaTopic.REAUTHENTICATION,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.REAUTHENTICATION)
    public async handle(@Payload() message: Consumers.Reauthentication.Message): Consumers.Reauthentication.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Reauthentication.Process.Props): Consumers.Reauthentication.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.REAUTHENTICATION, value: message });
        const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
        if (ttl > 0) {
            await this.reauthenticationCacheService.set({ session: message.payload.session, ttl });
        }
    }

    public async reject(props: Consumers.Reauthentication.Reject.Props): Consumers.Reauthentication.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in reauthentication consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(
                retryable ? KafkaTopicBuilder.retry(KafkaTopic.REAUTHENTICATION) : KafkaTopic.REAUTHENTICATION_DEAD,
                {
                    value: {
                        originalTopic: KafkaTopic.REAUTHENTICATION,
                        error: String(error),
                        payload: message,
                    },
                },
            ),
        );
    }
}
