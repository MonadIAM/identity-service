import { EntityManager, FilterQuery, FindOptions, Loaded } from "@mikro-orm/postgresql";

import { RecoveryCode as RecoveryCodeEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RecoveryCode {
            type Entity = RecoveryCodeEntity;

            interface Contract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;

                getStatus: (props: GetStatus.Props) => Promise<GetStatus.Result>;
            }

            type FindUnique<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindUniqueOrThrow<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type Find<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            namespace GetStatus {
                type Props = {
                    transaction?: EntityManager;
                    account: string;
                };

                type Result = {
                    remaining: number;
                    total: number;
                    used: number;
                };
            }
        }
    }
}
