import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { Account } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

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
        const where: ORM.FilterQuery<Account> = { id: props.account };

        if (props.mode === QueryMode.DEFAULT) {
            where.memberships = { realm: props.realm };
        }

        return this.accountRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where,
        });
    }

    public findMany(props: Queries.Account.FindMany.Props): Queries.Account.FindMany.Result {
        const filters: Repositories.Mappers.Account.Filters = { ...props.filters };

        if (props.mode === QueryMode.DEFAULT) {
            filters.realm = { operator: PublicLinkOperator.EQUAL, value: props.realm };
        }

        return this.accountRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }
}
