import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { InterfaceClient } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { InterfaceClientMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientRepository
    extends BaseRepository<Entities.InterfaceClient, Repositories.Mappers.InterfaceClient.Types>({
        Mapper: InterfaceClientMapper,
        Entity: InterfaceClient,
    })
    implements Repositories.InterfaceClient.Contract
{
    private readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.realmLimit = configService.getOrThrow<number>("INTERFACE_CLIENT_PER_REALM_LIMIT");
    }

    public async wouldExceedRealmLimit(
        props: Repositories.InterfaceClient.WouldExceedRealmLimit.Props,
    ): Repositories.InterfaceClient.WouldExceedRealmLimit.Result {
        try {
            const { transaction, realm } = props;
            const total = await transaction.count(InterfaceClient, { realm });

            return total + 1 > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
