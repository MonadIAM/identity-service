import { Inject, Injectable, Scope } from "@nestjs/common";

import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { Identifier } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierQueries implements Queries.Identifier.Contract {
    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
    ) {}

    public findUnique(props: Queries.Identifier.FindUnique): Promise<Identifier> {
        return this.identifierRepository.findUniqueOrThrow({
            where: { id: props.identifier },
        });
    }

    public findMany(props: Queries.Identifier.FindMany): Promise<[Identifier[], number]> {
        return this.identifierRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public getLookupList(props: Queries.Identifier.GetLookupList): Promise<[Identifier[], number]> {
        return this.identifierRepository.getLookupList({
            pagination: props.pagination,
            account: props.account,
            term: props.term,
        });
    }
}
