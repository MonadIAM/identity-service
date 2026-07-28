import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { raw } from "@mikro-orm/postgresql";

import { ExceptionMapper } from "~common/exceptions";
import { Account } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";
import { AccountStatus } from "~context/enums";

import { AccountAdapter } from "../adapters";

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
        protected readonly readManager: ORM.EntityManager,
        @InjectEntityManager("write")
        private readonly writeManager: ORM.EntityManager,
    ) {
        super();
    }

    public async getLookupList(props: Repositories.Account.GetLookupList.Props): Repositories.Account.GetLookupList.Result {
        try {
            const { pagination, term } = props;
            const entityManager = this.readManager.fork();

            let builder = entityManager
                .createQueryBuilder(Account, "a")
                .select(["a.id", "a.status"])
                .leftJoinAndSelect("a.profile", "p")
                .leftJoin("a.identifiers", "i")
                .groupBy(["a.id", "p.account"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (term) {
                builder = builder.andWhere("p.display_name % ? OR i.value % ?", [term, term]).orderBy({
                    [raw("GREATEST(similarity(p.display_name, ?), MAX(similarity(i.value, ?)))", [term, term])]: "DESC",
                });
            } else {
                builder = builder.orderBy({ "p.displayName": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async findExpiredPending(
        props: Repositories.Account.FindExpiredPending.Props,
    ): Repositories.Account.FindExpiredPending.Result {
        try {
            const { expirationDate, batchSize, transaction } = props;
            const entityManager = transaction ?? this.writeManager;

            return await entityManager.find(
                Account,
                { status: AccountStatus.PENDING, createdAt: { $lt: expirationDate } },
                { limit: batchSize },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async findExpiredInactive(
        props: Repositories.Account.FindExpiredInactive.Props,
    ): Repositories.Account.FindExpiredInactive.Result {
        try {
            const { expirationDate, batchSize, transaction } = props;
            const entityManager = transaction ?? this.writeManager;

            return await entityManager.find(
                Account,
                {
                    status: AccountStatus.ACTIVE,
                    [raw("COALESCE(last_active_at, updated_at, created_at)")]: { $lt: expirationDate },
                },
                { limit: batchSize },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
