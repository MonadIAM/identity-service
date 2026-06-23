import { Inject, Injectable, Scope } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/postgresql";

import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { Identifier } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierQueries implements Queries.Identifier.Contract {
    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
    ) {}

    public findUnique(props: Queries.Identifier.FindUnique.Props): Queries.Identifier.FindUnique.Result {
        const where: FilterQuery<Identifier> = { id: props.identifier };

        if (props.mode === QueryMode.DEFAULT) {
            where.account = props.actor;
        }

        return this.identifierRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.Identifier.FindMany.Props): Queries.Identifier.FindMany.Result {
        const filters: Adapters.Identifier.Filters = { ...props.filters };

        if (props.mode === QueryMode.DEFAULT) {
            filters.account = { operator: PublicLinkOperator.EQUAL, value: props.actor };
        }

        return this.identifierRepository.findMany({
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }

    public getLookupList(props: Queries.Identifier.GetLookupList.Props): Queries.Identifier.GetLookupList.Result {
        return this.identifierRepository.getLookupList({
            pagination: props.pagination,
            account: props.account,
            term: props.term,
        });
    }
}
