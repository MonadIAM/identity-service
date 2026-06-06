import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";

import { RecoveryCodeAdapter } from "~context/infrastructure/adapters";
import { RecoveryCode } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeRepository
    extends BaseRepository<Entities.RecoveryCode, Adapters.RecoveryCode.Types>({
        Adapter: RecoveryCodeAdapter,
        Entity: RecoveryCode,
    })
    implements Repositories.RecoveryCode.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }

    public async getStatus(props: Repositories.RecoveryCode.GetStatus.Props): Repositories.RecoveryCode.GetStatus.Result {
        try {
            const { account } = props;
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total, used }] = await knex("identity.recovery_code")
                .where("account_id", account)
                .select(
                    knex.raw("COUNT(*)::int AS total"),
                    knex.raw("COUNT(*) FILTER (WHERE used_at IS NOT NULL)::int AS used"),
                );

            return {
                remaining: Number(total) - Number(used),
                total: Number(total),
                used: Number(used),
            };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
