import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { MembershipAdapter } from "~context/infrastructure/adapters";
import { Membership } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipRepository
    extends BaseRepository<Entities.Membership, Adapters.Membership.Types>({
        Adapter: MembershipAdapter,
        Entity: Membership,
    })
    implements Repositories.Membership.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
