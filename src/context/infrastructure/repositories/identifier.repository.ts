import { EntityManager, Loaded } from "@mikro-orm/postgresql";
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
}
