import { EntityManager, Loaded, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { IdentifierAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Identifier } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierRepository extends IdentifierAdapter implements Repositories.Identifier.Contract {
    private readonly resource = "Identifier";

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
    }: Repositories.Identifier.FindUnique<P, F>): Promise<Nullable<Loaded<Identifier, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(Identifier, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Identifier.FindUniqueOrThrow<P, F>): Promise<Loaded<Identifier, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(Identifier, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.Identifier.Find<P, F>,
    ): Promise<Loaded<Identifier, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(Identifier, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Identifier.FindMany<P, F>,
    ): Promise<[Loaded<Identifier, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(Identifier, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(Identifier, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({
        pagination,
        term,
    }: Repositories.Identifier.GetLookupList): Promise<[Identifier[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Identifier, "i");

            builder
                .select(["i.id", "i.type", "i.value", "i.isVerified"])
                .leftJoinAndSelect("i.account", "a")
                .leftJoinAndSelect("a.profile", "p")
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (term) {
                builder.andWhere("i.value % ? OR p.display_name % ?", [term, term]).orderBy({
                    [raw("GREATEST(similarity(i.value, ?), similarity(p.display_name, ?))", [term, term])]: "DESC",
                });
            } else {
                builder.orderBy({ "i.value": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async isLastVerifiedIdentifier({
        transaction,
        identifier,
        account,
    }: Repositories.Identifier.IsLastVerifiedIdentifier): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ remaining }] = await knex("identity.identifier")
                .where("account_id", account)
                .andWhere("id", "!=", identifier)
                .andWhere("is_verified", true)
                .select(knex.raw("COUNT(*)::int AS remaining"));

            return Number(remaining) === 0;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
