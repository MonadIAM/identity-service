import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { AggregateType, EventType, KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface Contract {
                run: {
                    <T extends AnyEntity>(props: RunWithResult<T>): Promise<T>;
                    (props: RunVoid): Promise<void>;
                };
            }

            type Outbox<T> = {
                payloadMapper: (result: T) => AnyEntity | AnyEntity[];
                destinationTopic: KafkaTopic;
                aggregateType: AggregateType;
                metadata?: UnknownObject;
                eventType: EventType;
            };

            type RunWithResult<T extends AnyEntity> = {
                execute: (transaction: EntityManager) => Promise<T> | T;
                audit?: Entities.AuditLog.ConstructorProps;
                outbox?: Outbox<T>;
                changeLog?: boolean;
                resource?: string;
            };

            type RunVoid = {
                execute: (transaction: EntityManager) => Promise<void> | void;
                audit?: Entities.AuditLog.ConstructorProps;
                changeLog?: never;
                resource?: string;
                outbox?: never;
            };

            type Run<T extends AnyEntity> = RunWithResult<T> | RunVoid;
        }
    }
}
