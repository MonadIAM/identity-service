import { Inject, Injectable, Scope } from "@nestjs/common";

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
            changeLog: true,
            execute: async (transaction) => {
                await this.profileService.update({
                    input: { patch: props.input, account: props.actor },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }
}
