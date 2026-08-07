import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { Profile } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { ProfileMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileRepository
    extends BaseRepository<Entities.Profile, Repositories.Mappers.Profile.Types>({
        Mapper: ProfileMapper,
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
