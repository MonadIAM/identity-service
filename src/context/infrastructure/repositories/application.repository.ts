import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ApplicationAdapter } from "~context/infrastructure/adapters";
import { Application } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationRepository
    extends BaseRepository<Entities.Application, Adapters.Application.Types>({
        Adapter: ApplicationAdapter,
        Entity: Application,
    })
    implements Repositories.Application.Contract
{
    private readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.realmLimit = configService.getOrThrow<number>("APPLICATION_PER_REALM_LIMIT");
    }

    public async wouldExceedRealmLimit(
        props: Repositories.Application.WouldExceedRealmLimit.Props,
    ): Repositories.Application.WouldExceedRealmLimit.Result {
        try {
            const { transaction, realm } = props;
            const knex = transaction.getKnex();

            const [{ total }] = await knex("identity.application").where({ realm }).count("id as total");

            return Number(total) + 1 > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
