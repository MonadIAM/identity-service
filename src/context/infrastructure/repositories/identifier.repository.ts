import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { raw } from "@mikro-orm/postgresql";

import { Identifier } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { IdentifierMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierRepository
    extends BaseRepository<Entities.Identifier, Repositories.Mappers.Identifier.Types>({
        Mapper: IdentifierMapper,
        Entity: Identifier,
    })
    implements Repositories.Identifier.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }

    public async getLookupList(
        props: Repositories.Identifier.GetLookupList.Props,
    ): Repositories.Identifier.GetLookupList.Result {
        try {
            const { pagination, account, term } = props;
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
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }

    public async isLastVerifiedIdentifier(
        props: Repositories.Identifier.IsLastVerifiedIdentifier.Props,
    ): Repositories.Identifier.IsLastVerifiedIdentifier.Result {
        try {
            const { transaction, identifier, account } = props;
            const entityManager = transaction ?? this.readManager.fork();

            const remaining = await entityManager.count(Identifier, {
                account,
                id: { $ne: identifier },
                isVerified: true,
            });

            return remaining === 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
