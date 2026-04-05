import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";
import { SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorRepository implements Repositories.SecondFactor.Contract {
    private readonly resource = "SecondFactor";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {}

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.SecondFactor.FindUnique<P, F>): Promise<Nullable<Loaded<SecondFactor, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(SecondFactor, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.SecondFactor.FindUniqueOrThrow<P, F>): Promise<Loaded<SecondFactor, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(SecondFactor, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.SecondFactor.Find<P, F>,
    ): Promise<Loaded<SecondFactor, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(SecondFactor, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.SecondFactor.FindMany<P, F>,
    ): Promise<[Loaded<SecondFactor, P, F>[], number]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findAndCount(SecondFactor, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
