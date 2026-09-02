import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { raw } from "@mikro-orm/postgresql";

import { RecoveryCode } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { RecoveryCodeMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeRepository
    extends BaseRepository<Entities.RecoveryCode, Repositories.Mappers.RecoveryCode.Types>({
        Mapper: RecoveryCodeMapper,
        Entity: RecoveryCode,
    })
    implements Repositories.RecoveryCode.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }

    public async getStatus(props: Repositories.RecoveryCode.GetStatus.Props): Repositories.RecoveryCode.GetStatus.Result {
        try {
            const { account } = props;
            const entityManager = this.readManager.fork();

            const { total, used } = await entityManager
                .createQueryBuilder(RecoveryCode, "rc")
                .select([raw("COUNT(*)::int AS total"), raw("COUNT(*) FILTER (WHERE used_at IS NOT NULL)::int AS used")])
                .where({ account })
                .execute("get");

            return {
                remaining: Number(total) - Number(used),
                total: Number(total),
                used: Number(used),
            };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
