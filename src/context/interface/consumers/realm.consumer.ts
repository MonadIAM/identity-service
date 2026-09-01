import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { APPLICATION_COMMANDS } from "~context/application/commands";
import { CONSUMER_META } from "~context/constants";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly logger = new Logger(RealmConsumer.name);

    public constructor(
        @Inject(APPLICATION_COMMANDS)
        private readonly applicationCommands: Commands.Application.ConsumerContract,
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
            topic: KafkaTopic.REALM,
            handler: this,
        });
    }

    private readonly handlers: Consumers.Realm.Handlers = {
        [RealmTopicAction.RESTORE]: async (payload) => {
            await this.applicationCommands.restoreRealm({
                context: CONSUMER_META,
                ...payload,
            });
        },
        [RealmTopicAction.REVOKE]: async (payload) => {
            await this.applicationCommands.revokeRealm({
                context: CONSUMER_META,
                ...payload,
            });
        },
        [RealmTopicAction.PURGE]: async (payload) => {
            await this.applicationCommands.purgeRealm({
                context: CONSUMER_META,
                ...payload,
            });
        },
    };

    @EventPattern(KafkaTopic.REALM)
    public async handle(@Payload() message: Consumers.Realm.Message): Consumers.Realm.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Realm.Process.Props): Consumers.Realm.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.REALM, value: message });
        const handler = this.handlers[message.actionType];
        if (handler) {
            await handler(message.payload);
        } else {
            this.logger.warn(`Unknown realm action type: ${String(message.actionType)}`);
        }
    }

    public async reject(props: Consumers.Realm.Reject.Props): Consumers.Realm.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in realm consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.REALM) : KafkaTopic.REALM_DEAD, {
                value: {
                    originalTopic: KafkaTopic.REALM,
                    error: String(error),
                    payload: message,
                },
            }),
        );
    }
}
