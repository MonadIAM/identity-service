import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { APPLICATION_COMMANDS } from "~context/application/commands";
import { CONSUMER_META } from "~context/constants";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";
import {
    KAFKA_SCHEMA_REGISTRY,
    KAFKA_RETRY_REGISTRY,
    KafkaIncomingMapper,
    KafkaTopicBuilder,
    KAFKA_SERVICE,
} from "~infrastructure/kafka";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly logger = new Logger(RealmConsumer.name);
    private readonly consumerKey = "identity.realm.v1";

    public constructor(
        @Inject(APPLICATION_COMMANDS)
        private readonly applicationCommands: Commands.Application.ConsumerContract,
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
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
            consumerKey: this.consumerKey,
            topic: KafkaTopic.REALM,
            handler: this,
        });
    }

    private readonly handlers: Consumers.Realm.Handlers = {
        [RealmTopicAction.RESTORE]: async ({ incoming, payload }) => {
            await this.applicationCommands.restoreRealm({
                context: CONSUMER_META,
                incoming,
                ...payload,
            });
        },
        [RealmTopicAction.REVOKE]: async ({ incoming, payload }) => {
            await this.applicationCommands.revokeRealm({
                context: CONSUMER_META,
                incoming,
                ...payload,
            });
        },
        [RealmTopicAction.PURGE]: async ({ incoming, payload }) => {
            await this.applicationCommands.purgeRealm({
                context: CONSUMER_META,
                incoming,
                ...payload,
            });
        },
    };

    @EventPattern(KafkaTopic.REALM)
    public async handle(
        @Payload() message: Consumers.Realm.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Realm.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.process({ incoming, message });
        } catch (error) {
            await this.reject({ incoming, message, error });
        }
    }

    public async process(props: Consumers.Realm.Process.Props): Consumers.Realm.Process.Result {
        const { incoming, message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.REALM, value: message });
        const handler = this.handlers[message.actionType];
        if (handler) {
            await handler({ incoming, payload: message.payload });
        } else {
            this.logger.warn(`Unknown realm action type: ${String(message.actionType)}`);
        }
    }

    public async reject(props: Consumers.Realm.Reject.Props): Consumers.Realm.Reject.Result {
        const { incoming, message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in realm consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.REALM) : KafkaTopic.REALM_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.REALM,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        if (retryable) {
            this.kafkaMetrics.recordRetry({ topic: KafkaTopic.REALM, error });
        } else {
            this.kafkaMetrics.recordDead({ topic: KafkaTopic.REALM, error });
        }
    }
}
