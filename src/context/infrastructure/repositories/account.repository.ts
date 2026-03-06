import { EntityManager, Loaded, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { AccountAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Account } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRepository extends AccountAdapter implements Repositories.Account.Contract {
    private readonly resource = "Account";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Account.FindUnique<P, F>): Promise<Nullable<Loaded<Account, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(Account, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Account.FindUniqueOrThrow<P, F>): Promise<Loaded<Account, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(Account, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.Account.Find<P, F>,
    ): Promise<Loaded<Account, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(Account, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Account.FindMany<P, F>,
    ): Promise<[Loaded<Account, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(Account, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(Account, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({ pagination, term }: Repositories.Account.GetLookupList): Promise<[Account[], number]> {
        try {
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
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
