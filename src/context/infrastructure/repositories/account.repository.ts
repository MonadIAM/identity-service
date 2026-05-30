import { EntityManager, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { AccountAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Account } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRepository
    extends BaseRepository<Entities.Account, Adapters.Account.Types>({
        Adapter: AccountAdapter,
        Entity: Account,
    })
    implements Repositories.Account.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
    ) {
        super();
    }

    public async getLookupList(props: Repositories.Account.GetLookupList.Props): Repositories.Account.GetLookupList.Result {
        try {
            const { pagination, term } = props;
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Account, "a");

            builder
                .select(["a.id", "a.status"])
                .leftJoinAndSelect("a.profile", "p")
                .leftJoin("a.identifiers", "i")
                .groupBy(["a.id", "p.account_id"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (term) {
                builder.andWhere("p.display_name % ? OR i.value % ?", [term, term]).orderBy({
                    [raw("GREATEST(similarity(p.display_name, ?), MAX(similarity(i.value, ?)))", [term, term])]: "DESC",
                });
            } else {
                builder.orderBy({ "p.display_name": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async findExpiredPending(
        props: Repositories.Account.FindExpiredPending.Props,
    ): Repositories.Account.FindExpiredPending.Result {
        try {
            const { expirationDate, batchSize, transaction } = props;
            const entityManager = transaction ?? this.writeManager;

            const rows = await entityManager
                .getKnex()("identity.account")
                .select("*")
                .where("status", "pending")
                .andWhere("created_at", "<", expirationDate)
                .limit(batchSize);

            return rows.map((row) => entityManager.map(Account, row));
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async findExpiredInactive(
        props: Repositories.Account.FindExpiredInactive.Props,
    ): Repositories.Account.FindExpiredInactive.Result {
        try {
            const { expirationDate, batchSize, transaction } = props;
            const entityManager = transaction ?? this.writeManager;

            const rows = await entityManager
                .getKnex()("identity.account")
                .select("*")
                .where("status", "active")
                .andWhereRaw("COALESCE(last_active_at, updated_at, created_at) < ?", [expirationDate])
                .limit(batchSize);

            return rows.map((row) => entityManager.map(Account, row));
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
