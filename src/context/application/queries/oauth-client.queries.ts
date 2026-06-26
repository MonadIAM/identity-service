import { Inject, Injectable, Scope } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/postgresql";

import { OAUTH_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { OAuthClient } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthClientQueries implements Queries.OAuthClient.Contract {
    public constructor(
        @Inject(OAUTH_CLIENT_REPOSITORY)
        private readonly oauthClientRepository: Repositories.OAuthClient.Contract,
    ) {}

    public findUnique(props: Queries.OAuthClient.FindUnique.Props): Queries.OAuthClient.FindUnique.Result {
        const where: FilterQuery<OAuthClient> = { id: props.client };

        if (props.mode === QueryMode.DEFAULT) {
            where.realm = props.realm;
        }

        return this.oauthClientRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.OAuthClient.FindMany.Props): Queries.OAuthClient.FindMany.Result {
        const filters: Adapters.OAuthClient.Filters = { ...props.filters };

        if (props.mode === QueryMode.DEFAULT) {
            filters.realm = { operator: PublicLinkOperator.EQUAL, value: props.realm };
        }

        return this.oauthClientRepository.findMany({
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }
}
