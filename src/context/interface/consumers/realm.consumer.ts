import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { REALM_COMMANDS } from "~context/application/commands/tokens";
import { CONSUMER_META } from "~context/constants";
import { KafkaTopic } from "~context/enums";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly logger = new Logger(RealmConsumer.name);
    private readonly consumerKey = "identity.realm.v1";

    public constructor(
        @Inject(KAFKA_METRICS_RECORDER)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(REALM_COMMANDS)
        private readonly realmCommands: Commands.Realm.ConsumerContract,
        @Inject(KAFKA_RETRY_SERVICE)
        private readonly kafkaRetry: Kafka.Retry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    private readonly handlers: Consumers.Realm.Handlers = {
        [RealmTopicAction.RESTORE]: async ({ incoming, payload }) => {
            await this.realmCommands.restoreRealm({
                context: CONSUMER_META,
                incoming,
                ...payload,
            });
        },
        [RealmTopicAction.REVOKE]: async ({ incoming, payload }) => {
            await this.realmCommands.revokeRealm({
                context: CONSUMER_META,
                incoming,
                ...payload,
            });
        },
        [RealmTopicAction.PURGE]: async ({ incoming, payload }) => {
            await this.realmCommands.purgeRealm({
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
        const incoming = {
            consumerKey: this.consumerKey,
            event: this.incomingMapper.reference({ context }),
        };
        await this.kafkaRetry.execute({
            topic: KafkaTopic.REALM,
            heartbeat: context.getHeartbeat(),
            process: () =>
                this.process({
                    incoming: this.incomingMapper.map({ consumerKey: this.consumerKey, context }),
                    message,
                }),
            reject: (error) => this.reject({ incoming, message, error }),
        });
    }

    public async process(props: Consumers.Realm.Process.Props): Consumers.Realm.Process.Result {
        const { incoming } = props;
        const message = await this.schemaRegistry.decode<Consumers.Realm.Message>({
            topic: KafkaTopic.REALM,
            value: props.message,
        });
        this.schemaRegistry.validate({ topic: KafkaTopic.REALM, value: message });
        if (
            message.actionType === RealmTopicAction.REVOKE ||
            message.actionType === RealmTopicAction.RESTORE ||
            message.actionType === RealmTopicAction.PURGE
        ) {
            const handler = this.handlers[message.actionType];
            if (handler) {
                await handler({ incoming, payload: message.payload });
            } else {
                this.logger.warn(`Unknown realm action type: ${String(message.actionType)}`);
            }
        }
    }

    public async reject(props: Consumers.Realm.Reject.Props): Consumers.Realm.Reject.Result {
        const { incoming, message, error } = props;
        this.logger.warn(`Rejected message in realm consumer: ${String(error)}`);

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.REALM_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.REALM,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        this.kafkaMetrics.recordDead({ topic: KafkaTopic.REALM, error });
    }
}
