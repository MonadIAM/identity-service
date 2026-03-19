import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import { HASHING_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class AccountHandler implements Handlers.Account.Contract {
    private readonly dictionaryPath = "handlers.account";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
    ) {}

    public async deactivate({ context, input }: Handlers.Account.Deactivate): Promise<MessageResult> {
        try {
            const accountEntity = await this.accountRepository.findUniqueOrThrow({
                options: { populate: ["password", "sessions"] },
                where: { id: input.account },
            });

            const isValid = await this.hashingService.verify({
                storedHash: accountEntity.password!.hash,
                value: input.password,
            });

            if (isValid) {
                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    this.accountService.deactivate({
                        input: { account: accountEntity },
                        transaction,
                        context,
                    });

                    await transaction.flush();
                });
                return { message: `${this.dictionaryPath}.DEACTIVATED` };
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async suspend({ context, input, actor }: Handlers.Account.Suspend): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: input.account },
                    transaction,
                });

                this.accountService.suspend({
                    input: {
                        account: accountEntity,
                        reason: input.reason,
                    },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.SUSPENDED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async unsuspend({ context, input, actor }: Handlers.Account.Unsuspend): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: input.account },
                    transaction,
                });

                this.accountService.unsuspend({
                    input: {
                        account: accountEntity,
                        reason: input.reason,
                    },
                    transaction,
                    context,
                    actor,
                });

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.UNSUSPENDED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
