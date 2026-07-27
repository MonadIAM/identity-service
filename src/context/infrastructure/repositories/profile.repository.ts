import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { Profile } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { ProfileAdapter } from "../adapters";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileRepository
    extends BaseRepository<Entities.Profile, Adapters.Profile.Types>({
        Adapter: ProfileAdapter,
        Entity: Profile,
    })
    implements Repositories.Profile.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }
}
