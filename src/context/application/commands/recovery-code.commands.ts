import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { CRYPTO_SERVICE, HASHING_SERVICE } from "~common/services";
import { RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeCommands implements Commands.RecoveryCode.Contract {
    private readonly dictionaryPath = "commands.recovery-code";
    private readonly resource = "RecoveryCode";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async regenerate(
        props: Commands.RecoveryCode.Regenerate.Props,
    ): Promise<Commands.RecoveryCode.Regenerate.Result> {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.REGENERATE_RECOVERY_CODES,
                entityType: IdentityEntityType.ACCOUNT,
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
            },
        });

        return { message: `${this.dictionaryPath}.REGENERATED`, codes };
    }
}
