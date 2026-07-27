import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { PasswordAdapter } from "~context/infrastructure/adapters";
import { Password } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordRepository
    extends BaseRepository<Entities.Password, Adapters.Password.Types>({
        Adapter: PasswordAdapter,
        Entity: Password,
    })
    implements Repositories.Password.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
