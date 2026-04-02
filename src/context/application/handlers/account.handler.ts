import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { ACCOUNT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";
import { HASHING_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class AccountHandler implements Handlers.Account.Contract {
    private readonly dictionaryPath = "handlers.account";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
    ) {}

    public async deactivate(props: Handlers.Account.Deactivate): Promise<MessageResult> {
        const accountEntity = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password", "sessions"] },
            where: { id: props.input.account },
        });

        const isValid = await this.hashingService.verify({
            storedHash: accountEntity.password!.hash,
            value: props.input.password,
        });

        if (isValid) {
            await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                    entityType: IdentityEntityType.ACCOUNT,
                    ...props,
                },
                execute: (transaction) => {
                    this.accountService.deactivate({
                        input: { account: accountEntity },
                        transaction,
                    });
                },
            });
            return { message: `${this.dictionaryPath}.DEACTIVATED` };
        } else {
            throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
        }
    }

    public async suspend(props: Handlers.Account.Suspend): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SUSPEND_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.input.account },
                    transaction,
                });

                this.accountService.suspend({
                    transaction,
                    input: {
                        reason: props.input.reason,
                        account: accountEntity,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.SUSPENDED` };
    }

    public async unsuspend(props: Handlers.Account.Unsuspend): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.UNSUSPEND_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.input.account },
                    transaction,
                });

                this.accountService.unsuspend({
                    transaction,
                    input: {
                        reason: props.input.reason,
                        account: accountEntity,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.UNSUSPENDED` };
    }
}
