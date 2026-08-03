import { Inject, Injectable, Scope } from "@nestjs/common";
import {
    NotificationContentKind,
    NotificationTopicAction,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
} from "@monadiam/shared";

import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, HASHING_SERVICE } from "~common/services";
import { ACCOUNT_REPOSITORY } from "~context/domain/repositories";

import { RECOVERY_CODE_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeCommands implements Commands.RecoveryCode.Contract {
    private readonly dictionaryPath = "commands.recovery-code";
    private readonly resource = "RecoveryCode";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async regenerate(props: Commands.RecoveryCode.Regenerate.Props): Commands.RecoveryCode.Regenerate.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        await this.transactionalService.run<Entities.Account>({
            resource: this.resource,
            audit: {
                entityType: EntityType.RECOVERY_CODE,
                actionType: ActionType.REGENERATE,
                ...props,
            },
            outbox: {
                payloadMapper: this.notificationPayloadMapper.bind(this, { account: props.actor }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["recoveryCodes"] },
                    where: { id: props.actor },
                    transaction,
                });

                this.recoveryCodeService.regenerate({
                    transaction,
                    input: {
                        hashes: hashedCodes,
                        account: account,
                    },
                });

                return account;
            },
        });

        return { message: `${this.dictionaryPath}.REGENERATED`, codes };
    }

    public notificationPayloadMapper(
        props: Commands.RecoveryCode.NotificationPayloadMapper.Props,
    ): Commands.RecoveryCode.NotificationPayloadMapper.Result {
        return {
            template: MessageTemplate.RECOVERY_CODES_REGENERATED,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }
}
