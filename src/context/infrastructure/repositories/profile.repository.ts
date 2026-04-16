import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { ProfileAdapter } from "~context/infrastructure/adapters";
import { Profile } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileRepository
    extends BaseRepository<Profile, Adapters.Profile.Types>({
        Adapter: ProfileAdapter,
        Entity: Profile,
    })
    implements Repositories.Profile.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }
}
