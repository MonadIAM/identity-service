import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentifierType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AccountQueries implements Queries.Account.Contract {
    private readonly populate = {
        DETAILED: ["profile", "identifiers"] as const,
        COMPACT: ["profile"] as const,
    };

    public constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.QueryContract,
    ) {}

    public async getSecurity(props: Queries.Account.GetSecurity.Props): Queries.Account.GetSecurity.Result {
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password", "secondFactors", "identifiers"] },
            where: { id: props.account },
        });

        const hasPassword = Boolean(account.password);
        const hasSecondFactor = account.secondFactors.getItems().some((factor) => {
            return Boolean(factor.confirmedAt);
        });
        const hasEmail = account.identifiers.getItems().some((identifier) => {
            return identifier.type === IdentifierType.EMAIL && identifier.isVerified;
        });

        return { hasPassword, hasSecondFactor, canConfirmByEmail: !hasPassword && !hasSecondFactor && hasEmail };
    }

    public findMe(props: Queries.Account.FindMe.Props): Queries.Account.FindMe.Result {
        return this.accountRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.account },
        });
    }

    public findUnique(props: Queries.Account.FindUnique.Props): Queries.Account.FindUnique.Result {
        return this.accountRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.account },
        });
    }

    public findMany(props: Queries.Account.FindMany.Props): Queries.Account.FindMany.Result {
        return this.accountRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            sort: props.sort,
            filters: props.filters,
        });
    }
}
