import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";
import { RecoveryCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeRepository implements Repositories.RecoveryCode.Contract {
    private readonly resource = "RecoveryCode";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
    ) {}

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RecoveryCode.FindUnique<P, F>): Promise<Nullable<Loaded<RecoveryCode, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RecoveryCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RecoveryCode.FindUniqueOrThrow<P, F>): Promise<Loaded<RecoveryCode, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RecoveryCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.RecoveryCode.Find<P, F>,
    ): Promise<Loaded<RecoveryCode, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(RecoveryCode, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getStatus({
        account,
    }: Repositories.RecoveryCode.GetStatus.Props): Promise<Repositories.RecoveryCode.GetStatus.Result> {
        try {
            const entityManager = this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total, used }] = await knex("identity.recovery_code")
                .where("account_id", account)
                .select(
                    knex.raw("COUNT(*)::int AS total"),
                    knex.raw("COUNT(*) FILTER (WHERE used_at IS NOT NULL)::int AS used"),
                );

            return {
                remaining: Number(total) - Number(used),
                total: Number(total),
                used: Number(used),
            };
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
