import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/contracts";
import { lastValueFrom } from "rxjs";

import { OAUTH_CLIENT_COMMANDS } from "~context/application/commands";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly logger = new Logger(RealmConsumer.name);

    public constructor(
        @Inject(OAUTH_CLIENT_COMMANDS)
        private readonly oauthClientCommands: Commands.OAuthClient.ConsumerContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    private readonly handlers: Consumers.Realm.Handlers = {
        [RealmTopicAction.RESTORE]: (payload) => this.oauthClientCommands.restoreRealm(payload),
        [RealmTopicAction.REVOKE]: (payload) => this.oauthClientCommands.revokeRealm(payload),
        [RealmTopicAction.PURGE]: (payload) => this.oauthClientCommands.purgeRealm(payload),
    };

    @EventPattern(KafkaTopic.REALM)
    public async handle(@Payload() message: Consumers.Realm.Message, @Ctx() context: KafkaContext): Promise<void> {
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
