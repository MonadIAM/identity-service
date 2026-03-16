import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileHandler implements Handlers.Profile.Contract {
    private readonly dictionaryPath = "handlers.profile";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
    ) {}

    public async update({ input: { account, patch } }: Handlers.Profile.Update): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["profile"] },
                    where: { id: account },
                    transaction,
                });

                accountEntity.profile?.changeData(patch);

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.UPDATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
