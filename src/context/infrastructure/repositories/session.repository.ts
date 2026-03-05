import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { SessionAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Session } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionRepository extends SessionAdapter implements Repositories.Session.Contract {
    private readonly resource = "Session";

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
    }: Repositories.Session.FindUnique<P, F>): Promise<Nullable<Loaded<Session, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(Session, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Session.FindUniqueOrThrow<P, F>): Promise<Loaded<Session, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(Session, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.Session.Find<P, F>,
    ): Promise<Loaded<Session, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(Session, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Session.FindMany<P, F>,
    ): Promise<[Loaded<Session, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(Session, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(Session, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
