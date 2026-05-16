import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { PasswordHistoryAdapter } from "~context/infrastructure/adapters";
import { PasswordHistory } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordHistoryRepository
    extends BaseRepository<Entities.PasswordHistory, Adapters.PasswordHistory.Types>({
        Adapter: PasswordHistoryAdapter,
        Entity: PasswordHistory,
    })
    implements Repositories.PasswordHistory.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
