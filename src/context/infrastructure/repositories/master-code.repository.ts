import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { MasterCode } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { MasterCodeAdapter } from "../adapters";

@Injectable({ scope: Scope.DEFAULT })
export class MasterCodeRepository
    extends BaseRepository<Entities.MasterCode, Adapters.MasterCode.Types>({
        Adapter: MasterCodeAdapter,
        Entity: MasterCode,
    })
    implements Repositories.MasterCode.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
