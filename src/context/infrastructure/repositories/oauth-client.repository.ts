import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { OAuthClientAdapter } from "~context/infrastructure/adapters";
import { OAuthClient } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthClientRepository
    extends BaseRepository<Entities.OAuthClient, Adapters.OAuthClient.Types>({
        Adapter: OAuthClientAdapter,
        Entity: OAuthClient,
    })
    implements Repositories.OAuthClient.Contract
{
    private readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        configService: ConfigService,
    ) {
        super();
        this.realmLimit = configService.getOrThrow<number>("OAUTH_CLIENT_PER_REALM_LIMIT");
    }

    public async wouldExceedRealmLimit(
        props: Repositories.OAuthClient.WouldExceedRealmLimit.Props,
    ): Repositories.OAuthClient.WouldExceedRealmLimit.Result {
        try {
            const { transaction, realm } = props;
            const knex = transaction.getKnex();

            await knex.raw("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", [`oauth-client:${realm}`]);

            const [{ total }] = await knex("identity.oauth_client").where({ realm }).count("id as total");

            return Number(total) + 1 > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
