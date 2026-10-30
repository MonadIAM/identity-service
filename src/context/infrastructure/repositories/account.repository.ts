import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { LockMode, raw } from "@mikro-orm/postgresql";
import { sql } from "kysely";

import { kysely } from "~infrastructure/database/utils";
import { ExceptionMapper } from "~common/exceptions";
import { Account } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";
import { AccountStatus } from "~context/enums";

import { AccountMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRepository
    extends BaseRepository<Entities.Account, Repositories.Mappers.Account.Types>({
        Mapper: AccountMapper,
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

            // NOTE[SQL-01]: see NOTES.md#SQL-01
            const dataQuery = kysely
                .selectFrom("identity.account as a")
                .leftJoin("identity.profile as p", "p.account_id", "a.id")
                .leftJoinLateral(
                    (eb) =>
                        eb
                            .selectFrom("identity.identifier as identifier")
                            .select("identifier.identity")
                            .whereRef("identifier.account_id", "=", "a.id")
                            .where(sql<boolean>`identifier.identity % ${term}`)
                            .orderBy(sql<number>`similarity(identifier.identity, ${term})`, "desc")
                            .orderBy("identifier.identity", "asc")
                            .orderBy("identifier.id", "asc")
                            .limit(1)
                            .as("i"),
                    (join) => join.onTrue(),
                )
                .select(["a.id", "a.status", "p.display_name as displayName", "i.identity as identifier"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage)
                .$if(Boolean(term), (query) =>
                    query
                        .where((eb) => eb.or([sql<boolean>`p.display_name % ${term}`, eb("i.identity", "is not", null)]))
                        .orderBy(
                            sql<number>`GREATEST(similarity(p.display_name, ${term}), COALESCE(similarity(i.identity, ${term}), 0))`,
                            "desc",
                        ),
                )
                .orderBy("p.display_name", "asc")
                .orderBy("a.id", "asc")
                .compile();

            const countQuery = kysely
                .selectFrom("identity.account as a")
                .leftJoin("identity.profile as p", "p.account_id", "a.id")
                .$if(Boolean(term), (query) =>
                    query.where((eb) =>
                        eb.or([
                            sql<boolean>`p.display_name % ${term}`,
                            eb.exists(
                                eb
                                    .selectFrom("identity.identifier as identifier")
                                    .select(sql<number>`1`.as("matched"))
                                    .whereRef("identifier.account_id", "=", "a.id")
                                    .where(sql<boolean>`identifier.identity % ${term}`),
                            ),
                        ]),
                    ),
                )
                .select((eb) => eb.fn.count("a.id").as("total"))
                .compile();

            const [rows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Account.GetLookupList.Row[]>(
                    dataQuery.sql,
                    [...dataQuery.parameters],
                    "all",
                ),
                entityManager.execute<Repositories.Account.GetLookupList.CountRow>(
                    countQuery.sql,
                    [...countQuery.parameters],
                    "get",
                ),
            ]);

            return [rows, Number(countRow?.total ?? 0)];
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async findExpiredDeactivated(
        props: Repositories.Account.FindExpiredDeactivated.Props,
    ): Repositories.Account.FindExpiredDeactivated.Result {
        try {
            const { expirationDate, batchSize, transaction } = props;

            return await transaction.find(
                Account,
                { status: AccountStatus.DEACTIVATED, deactivatedAt: { $lte: expirationDate } },
                {
                    orderBy: { deactivatedAt: "asc", id: "asc" },
                    lockMode: LockMode.PESSIMISTIC_WRITE,
                    limit: batchSize,
                    refresh: true,
                },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
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
                { limit: batchSize, ...(transaction ? { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true } : {}) },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
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
                    [raw((alias) => `COALESCE(${alias}.last_active_at, ${alias}.updated_at, ${alias}.created_at)`)]: {
                        $lt: expirationDate,
                    },
                },
                { limit: batchSize },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
