import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileHandler implements Handlers.Profile.Contract {
    private readonly dictionaryPath = "handlers.profile";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
    ) {}

    public async update(props: Handlers.Profile.Update): Promise<MessageResult> {
        try {
            await this.transactional.run({
                audit: {
                    actionType: IdentityActionType.CREATE_SESSION,
                    entityType: IdentityEntityType.IDENTIFIER,
                    ...props,
                },
                execute: async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        options: { populate: ["profile"] },
                        where: { id: props.input.account },
                        transaction,
                    });

                    accountEntity.profile?.changeData(props.input.patch);
                },
            });

            return { message: `${this.dictionaryPath}.UPDATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
