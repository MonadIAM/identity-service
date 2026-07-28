import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { InterfaceClient } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { InterfaceClientAdapter } from "../adapters";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientRepository
    extends BaseRepository<Entities.InterfaceClient, Adapters.InterfaceClient.Types>({
        Adapter: InterfaceClientAdapter,
        Entity: InterfaceClient,
    })
    implements Repositories.InterfaceClient.Contract
{
    private readonly applicationLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.applicationLimit = configService.getOrThrow<number>("INTERFACE_CLIENT_PER_APPLICATION_LIMIT");
    }

    public async wouldExceedApplicationLimit(
        props: Repositories.InterfaceClient.WouldExceedApplicationLimit.Props,
    ): Repositories.InterfaceClient.WouldExceedApplicationLimit.Result {
        try {
            const { transaction, application } = props;
            const total = await transaction.count(InterfaceClient, { application });

            return total + 1 > this.applicationLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
