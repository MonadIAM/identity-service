import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { SecondFactor } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { SecondFactorMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorRepository
    extends BaseRepository<Entities.SecondFactor, Repositories.Mappers.SecondFactor.Types>({
        Mapper: SecondFactorMapper,
        Entity: SecondFactor,
    })
    implements Repositories.SecondFactor.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
