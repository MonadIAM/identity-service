import { FilterQuery, ObjectQuery } from "@mikro-orm/postgresql";
import { Inject, Injectable, Scope } from "@nestjs/common";

import { SERVICE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ServiceClient } from "~context/domain/entities";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientQueries implements Queries.ServiceClient.Contract {
    public constructor(
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.Contract,
    ) {}

    public findUnique(props: Queries.ServiceClient.FindUnique.Props): Queries.ServiceClient.FindUnique.Result {
        const where: FilterQuery<ServiceClient> = { id: props.client };

        if (props.mode === QueryMode.DEFAULT) {
            where.application = { id: props.application, realm: props.realm };
        }

        return this.serviceClientRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.ServiceClient.FindMany.Props): Queries.ServiceClient.FindMany.Result {
        const prefilter: ObjectQuery<ServiceClient> = {};

        if (props.mode === QueryMode.DEFAULT) {
            prefilter.application = { id: props.application, realm: props.realm };
        }

        return this.serviceClientRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
