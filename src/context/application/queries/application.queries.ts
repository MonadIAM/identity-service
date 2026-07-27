import { Inject, Injectable, Scope } from "@nestjs/common";

import { APPLICATION_REPOSITORY } from "~context/domain/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { Application } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationQueries implements Queries.Application.Contract {
    public constructor(
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.Contract,
    ) {}

    public findUnique(props: Queries.Application.FindUnique.Props): Queries.Application.FindUnique.Result {
        const where: ORM.FilterQuery<Application> = { id: props.application };

        if (props.mode === QueryMode.DEFAULT) {
            where.realm = props.realm;
        }

        return this.applicationRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.Application.FindMany.Props): Queries.Application.FindMany.Result {
        const filters: Adapters.Application.Filters = { ...props.filters };

        if (props.mode === QueryMode.DEFAULT) {
            filters.realm = { operator: PublicLinkOperator.EQUAL, value: props.realm };
        }

        return this.applicationRepository.findMany({
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }
}
