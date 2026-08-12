import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { MembershipHistory } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { MembershipHistoryMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipHistoryRepository
    extends BaseRepository<Entities.MembershipHistory, Repositories.Mappers.MembershipHistory.Types>({
        Mapper: MembershipHistoryMapper,
        Entity: MembershipHistory,
    })
    implements Repositories.MembershipHistory.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
