import { Inject, Injectable, Scope } from "@nestjs/common";

import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ACCOUNT_REPOSITORY } from "~context/domain/repositories";
import { ActionType, EntityType } from "~context/enums";

import { PROFILE_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileCommands implements Commands.Profile.Contract {
    private readonly dictionaryPath = "commands.profile";
    private readonly resource = "Profile";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(PROFILE_SERVICE)
        private readonly profileService: Services.Profile.CommandContract,
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
