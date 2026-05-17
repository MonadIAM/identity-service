import { Inject, Injectable, Scope } from "@nestjs/common";

import { SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorQueries implements Queries.SecondFactor.Contract {
    public constructor(
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
    ) {}

    public findMany(props: Queries.SecondFactor.FindMany.Props): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorRepository.findMany({
            where: { account: props.account },
        });
    }
}
