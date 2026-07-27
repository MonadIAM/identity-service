import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { Password } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { PasswordAdapter } from "../adapters";

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
