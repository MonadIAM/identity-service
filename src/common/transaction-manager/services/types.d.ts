import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface Contract {
                run: {
                    <T extends AnyEntity | AnyEntity[]>(props: RunWithResult<T>): Promise<T>;
                    (props: RunVoid): Promise<void>;
                };
                emit(props: Emit): Promise<void>;
            }

            type OutboxConfig<T> = {
                payloadMapper?(result: T): AnyEntity | AnyEntity[];
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
            };

            type RunWithResult<T extends AnyEntity | AnyEntity[]> = {
                execute(transaction: EntityManager): Promise<T> | T;
                audit?: Entities.AuditLog.ConstructorProps;
                outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                changeLog?: boolean;
                resource?: string;
            };

            type RunVoid = {
                execute(transaction: EntityManager): Promise<void> | void;
                audit?: Entities.AuditLog.ConstructorProps;
                changeLog?: never;
                resource?: string;
                outbox?: never;
            };

            type Emit = {
                payload: UnknownObject;
                audit?: Entities.AuditLog.ConstructorProps;
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
                resource?: string;
            };

            type Run<T extends AnyEntity | AnyEntity[]> = RunWithResult<T> | RunVoid;
        }
    }
}
