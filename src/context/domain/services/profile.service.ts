import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileService implements Services.Profile.Contract {
    public constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
    ) {}

    public async update(props: Services.Profile.Update.Props): Services.Profile.Update.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["profile"] },
            where: { id: input.account },
            transaction,
        });

        account.profile!.update(input.patch);
    }
}
