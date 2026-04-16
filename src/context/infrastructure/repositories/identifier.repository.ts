import { EntityManager, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { IdentifierAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Identifier } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierRepository
    extends BaseRepository<Identifier, Adapters.Identifier.Types>({
        Adapter: IdentifierAdapter,
        Entity: Identifier,
    })
    implements Repositories.Identifier.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
    ) {
        super();
    }

    public async getLookupList({
        pagination,
        account,
        term,
    }: Repositories.Identifier.GetLookupList): Promise<[Identifier[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Identifier, "i");

            builder
                .select(["i.id", "i.type", "i.value", "i.isVerified"])
                .leftJoinAndSelect("i.account", "a")
                .leftJoinAndSelect("a.profile", "p")
                .where({ "a.id": account })
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
            throw RepositoryException.fromOrmError(error, this.constructor.name);
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
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
