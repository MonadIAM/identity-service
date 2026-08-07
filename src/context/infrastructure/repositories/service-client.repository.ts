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
    private readonly applicationLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.applicationLimit = configService.getOrThrow<number>("SERVICE_CLIENT_PER_APPLICATION_LIMIT");
    }

    public async wouldExceedApplicationLimit(
        props: Repositories.ServiceClient.WouldExceedApplicationLimit.Props,
    ): Repositories.ServiceClient.WouldExceedApplicationLimit.Result {
        try {
            const { transaction, application } = props;
            const total = await transaction.count(ServiceClient, { application });

            return total + 1 > this.applicationLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
