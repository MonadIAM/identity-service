import { Inject, Injectable, Scope } from "@nestjs/common";

import { INTERFACE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { InterfaceClient } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientQueries implements Queries.InterfaceClient.Contract {
    public constructor(
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.QueryContract,
    ) {}

    public findUnique(props: Queries.InterfaceClient.FindUnique.Props): Queries.InterfaceClient.FindUnique.Result {
        const where: ORM.FilterQuery<InterfaceClient> = { id: props.client };

        if (props.mode === QueryMode.DEFAULT) {
            where.application = { id: props.application, realm: props.realm };
        }

        return this.interfaceClientRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.InterfaceClient.FindMany.Props): Queries.InterfaceClient.FindMany.Result {
        const prefilter: ORM.ObjectQuery<InterfaceClient> = {};

        if (props.mode === QueryMode.DEFAULT) {
            prefilter.application = { id: props.application, realm: props.realm };
        }

        return this.interfaceClientRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
