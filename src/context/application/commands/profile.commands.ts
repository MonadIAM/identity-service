import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { PROFILE_SERVICE } from "~context/domain/services";
import { ActionType, EntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileCommands implements Commands.Profile.Contract {
    private readonly dictionaryPath = "commands.profile";
    private readonly resource = "Profile";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(PROFILE_SERVICE)
        private readonly profileService: Services.Profile.Contract,
    ) {}

    public async update(props: Commands.Profile.Update.Props): Commands.Profile.Update.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PROFILE,
                actionType: ActionType.UPDATE,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["profile"] },
                    where: { id: props.actor },
                    transaction,
                });

                this.profileService.update({
                    input: {
                        profile: account.profile!,
                        patch: props.input,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }
}
