import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, HASHING_SERVICE } from "~common/services";
import { ACCOUNT_REPOSITORY } from "~context/domain/repositories";

import { RECOVERY_CODE_SERVICE } from "../services";
import { RecoveryCodeMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeCommands implements Commands.RecoveryCode.Contract {
    private readonly mapper = new RecoveryCodeMapper();
    private readonly dictionaryPath = "commands.recovery-code";
    private readonly resource = "RecoveryCode";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.CommandContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {}

    public async regenerate(props: Commands.RecoveryCode.Regenerate.Props): Commands.RecoveryCode.Regenerate.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.RECOVERY_CODE,
                actionType: ActionType.REGENERATE,
                ...props,
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

                return { account: props.actor };
            },
        });

        return { message: `${this.dictionaryPath}.REGENERATED`, codes };
    }
}
