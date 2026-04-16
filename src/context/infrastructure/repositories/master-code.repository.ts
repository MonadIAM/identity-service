import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { MasterCodeAdapter } from "~context/infrastructure/adapters";
import { BaseRepository } from "~common/mixins";
import { MasterCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class MasterCodeRepository
    extends BaseRepository<MasterCode, Adapters.MasterCode.Types>({
        Adapter: MasterCodeAdapter,
        Entity: MasterCode,
    })
    implements Repositories.MasterCode.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
