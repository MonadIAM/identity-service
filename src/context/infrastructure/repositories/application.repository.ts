import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Application } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { ApplicationAdapter } from "../adapters";

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
        protected readonly readManager: ORM.EntityManager,
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
            const total = await transaction.count(Application, { realm });

            return total + 1 > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
