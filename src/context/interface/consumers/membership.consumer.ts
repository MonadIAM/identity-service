import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { MembershipTopicAction } from "@liam/contracts";
import { lastValueFrom } from "rxjs";

import { MEMBERSHIP_COMMANDS } from "~context/application/commands";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class MembershipConsumer implements Consumers.Membership.Contract, OnModuleInit {
    private readonly logger = new Logger(MembershipConsumer.name);

    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.MEMBERSHIP)
    public async handle(@Payload() message: Consumers.Membership.Message, @Ctx() context: KafkaContext): Promise<void> {
        try {
            const { actionType, payload } = message;
            switch (actionType) {
                case MembershipTopicAction.GRANT:
                    await this.membershipCommands.grant({
                        input: {
                            joinedAt: new Date(payload.joinedAt),
                            invitedBy: payload.invitedBy,
                            account: payload.account,
                            realm: payload.realm,
                        },
                    });
                    break;
                case MembershipTopicAction.REVOKE:
                    await this.membershipCommands.revoke({
                        input: { account: payload.account, realm: payload.realm },
                    });
                    break;
                default:
                    this.logger.warn(`Unknown membership action type: ${String(actionType)}`);
            }
        } catch (error) {
            if (Exception.isRetryable(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.MEMBERSHIP_RETRY, {
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                        value: {
                            originalTopic: KafkaTopic.MEMBERSHIP,
                            payload: message.payload,
                            error: String(error),
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in membership consumer: ${String(error)}`);
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.MEMBERSHIP_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.MEMBERSHIP,
                            payload: message.payload,
                            error: String(error),
                        },
                    }),
                );
            }
        }
    }
}
