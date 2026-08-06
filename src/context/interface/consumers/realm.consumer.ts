import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

import { APPLICATION_COMMANDS } from "../commands";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly logger = new Logger(RealmConsumer.name);

    public constructor(
        @Inject(APPLICATION_COMMANDS)
        private readonly applicationCommands: Commands.Application.ConsumerContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    private readonly handlers: Consumers.Realm.Handlers = {
        [RealmTopicAction.RESTORE]: async (payload) => {
            await this.applicationCommands.restoreRealm(payload);
        },
        [RealmTopicAction.REVOKE]: async (payload) => {
            await this.applicationCommands.revokeRealm(payload);
        },
        [RealmTopicAction.PURGE]: async (payload) => {
            await this.applicationCommands.purgeRealm(payload);
        },
    };

    @EventPattern(KafkaTopic.REALM)
    public async handle(
        @Payload() message: Consumers.Realm.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Realm.Handle.Result {
        try {
            const handler = this.handlers[message.actionType];
            if (handler) {
                await handler(message.payload);
            } else {
                this.logger.warn(`Unknown realm action type: ${String(message.actionType)}`);
            }
        } catch (error) {
            if (Exception.isRetryable(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.REALM_RETRY, {
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                        value: {
                            originalTopic: KafkaTopic.REALM,
                            payload: message,
                            error: String(error),
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in realm consumer: ${String(error)}`);

                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.REALM_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.REALM,
                            payload: message,
                            error: String(error),
                        },
                    }),
                );
            }
        }
    }
}
