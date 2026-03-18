import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ACCOUNT_SERVICE } from "~context/domain/services";
import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE } from "~common/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AccountHandler implements Handlers.Account.Contract {
    private readonly dictionaryPath = "handlers.account";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
    ) {}

    public async deactivate({
        input: { password, account },
        context,
    }: Handlers.Account.Deactivate): Promise<MessageResult> {
        try {
            const accountEntity = await this.accountRepository.findUniqueOrThrow({
                options: { populate: ["password"] },
                where: { id: account },
            });

            if (accountEntity.password) {
                const isValid = await this.hashingService.verify({
                    storedHash: accountEntity.password.hash,
                    value: password,
                });

                if (isValid) {
                    const writeManager = this.writeManager.fork();
                    await writeManager.transactional(async (transaction) => {
                        await this.accountService.deactivate({
                            input: { entity: accountEntity },
                            transaction,
                            context,
                        });
                    });
                    return { message: `${this.dictionaryPath}.DEACTIVATED` };
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                }
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async suspend({ input: { account, reason }, context, actor }: Handlers.Account.Suspend): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: account },
                    transaction,
                });

                await this.accountService.suspend({
                    input: { entity: accountEntity, reason },
                    transaction,
                    context,
                    actor,
                });
            });

            return { message: `${this.dictionaryPath}.SUSPENDED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async unsuspend({
        input: { account, reason },
        context,
        actor,
    }: Handlers.Account.Unsuspend): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: account },
                    transaction,
                });

                await this.accountService.unsuspend({
                    input: { entity: accountEntity, reason },
                    transaction,
                    context,
                    actor,
                });
            });

            return { message: `${this.dictionaryPath}.UNSUSPENDED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
