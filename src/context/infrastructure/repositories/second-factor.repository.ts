import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { SecondFactorAdapter } from "~context/infrastructure/adapters";
import { SecondFactor } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorRepository
    extends BaseRepository<Entities.SecondFactor, Adapters.SecondFactor.Types>({
        Adapter: SecondFactorAdapter,
        Entity: SecondFactor,
    })
    implements Repositories.SecondFactor.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
