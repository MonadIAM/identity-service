import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { PROFILE_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileCommands implements Commands.Profile.Contract {
    private readonly dictionaryPath = "commands.profile";
    private readonly resource = "Profile";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(PROFILE_SERVICE)
        private readonly profileService: Services.Profile.Contract,
    ) {}

    public async update(props: Commands.Profile.Update): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.UPDATE_PROFILE,
                entityType: IdentityEntityType.ACCOUNT,
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
