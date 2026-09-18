import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";

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
