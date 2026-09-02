import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { raw } from "@mikro-orm/postgresql";

import { knex } from "~infrastructure/database/utils";
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
            let dataQuery = knex
                .select({ id: "a.id", status: "a.status", displayName: "p.display_name", identifier: "i.value" })
                .from({ a: "identity.account" })
                .leftJoin({ p: "identity.profile" }, "p.account_id", "a.id")
                .joinRaw(
                    "LEFT JOIN LATERAL (SELECT value FROM identity.identifier WHERE account_id = a.id AND value % ? ORDER BY similarity(value, ?) DESC LIMIT 1) i ON true",
                    [term, term],
                )
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            let countQuery = knex
                .from({ a: "identity.account" })
                .leftJoin({ p: "identity.profile" }, "p.account_id", "a.id");

            if (term) {
                dataQuery = dataQuery
                    .whereRaw("p.display_name % ? OR i.value IS NOT NULL", [term])
                    .orderByRaw("GREATEST(similarity(p.display_name, ?), COALESCE(similarity(i.value, ?), 0)) DESC", [
                        term,
                        term,
                    ]);
                countQuery = countQuery.whereRaw(
                    "p.display_name % ? OR EXISTS (SELECT 1 FROM identity.identifier WHERE account_id = a.id AND value % ?)",
                    [term, term],
                );
            } else {
                dataQuery = dataQuery.orderBy("p.display_name", "asc");
            }

            const dataSQL = dataQuery.toSQL();
            const countSQL = countQuery.count("a.id as total").toSQL();

            const [rows, countRow] = await Promise.all([
                entityManager.execute<Repositories.Account.GetLookupList.Row[]>(dataSQL.sql, [...dataSQL.bindings], "all"),
                entityManager.execute<Repositories.Account.GetLookupList.CountRow>(
                    countSQL.sql,
                    [...countSQL.bindings],
                    "get",
                ),
            ]);

            return [rows, Number(countRow?.total ?? 0)];
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
                { limit: batchSize },
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
                    [raw("COALESCE(last_active_at, updated_at, created_at)")]: { $lt: expirationDate },
                },
                { limit: batchSize },
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
