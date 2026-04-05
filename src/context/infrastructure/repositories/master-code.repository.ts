import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";
import { MasterCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class MasterCodeRepository implements Repositories.MasterCode.Contract {
    private readonly resource = "MasterCode";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {}

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.MasterCode.FindUnique<P, F>): Promise<Nullable<Loaded<MasterCode, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(MasterCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.MasterCode.FindUniqueOrThrow<P, F>): Promise<Loaded<MasterCode, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(MasterCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.MasterCode.Find<P, F>,
    ): Promise<Loaded<MasterCode, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(MasterCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
