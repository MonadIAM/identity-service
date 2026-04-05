import { Inject, Injectable, Scope } from "@nestjs/common";

import { SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorQueries implements Queries.SecondFactor.Contract {
    public constructor(
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
    ) {}

    public findMany(props: Queries.SecondFactor.FindMany): Promise<[SecondFactor[], number]> {
        return this.secondFactorRepository.findMany({
            where: { account: props.account },
        });
    }
}
