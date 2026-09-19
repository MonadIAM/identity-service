import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ServiceClient } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { ServiceClientMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientRepository
    extends BaseRepository<Entities.ServiceClient, Repositories.Mappers.ServiceClient.Types>({
        Mapper: ServiceClientMapper,
        Entity: ServiceClient,
    })
    implements Repositories.ServiceClient.Contract
{
    private readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.realmLimit = configService.getOrThrow<number>("SERVICE_CLIENT_PER_REALM_LIMIT");
    }

    public async wouldExceedRealmLimit(
        props: Repositories.ServiceClient.WouldExceedRealmLimit.Props,
    ): Repositories.ServiceClient.WouldExceedRealmLimit.Result {
        try {
            const { transaction, realm } = props;
            const total = await transaction.count(ServiceClient, { realm });

            return total + 1 > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
