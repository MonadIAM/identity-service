import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { PasswordHistory } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { PasswordHistoryMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordHistoryRepository
    extends BaseRepository<Entities.PasswordHistory, Repositories.Mappers.PasswordHistory.Types>({
        Mapper: PasswordHistoryMapper,
        Entity: PasswordHistory,
    })
    implements Repositories.PasswordHistory.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
