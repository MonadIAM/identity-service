import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { Membership } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { MembershipAdapter } from "../adapters";

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
