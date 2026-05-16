import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { SessionAdapter } from "~context/infrastructure/adapters";
import { Session } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class SessionRepository
    extends BaseRepository<Entities.Session, Adapters.Session.Types>({
        Adapter: SessionAdapter,
        Entity: Session,
    })
    implements Repositories.Session.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
