import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface PublicContract {
                run<T extends AnyEntity | AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
                emit(props: Emit.Props): Emit.Result;
            }

            interface PrivateContract {
                buildAuditLogArchiveOutbox(props: BuildAuditLogArchiveOutbox.Props): BuildAuditLogArchiveOutbox.Result;
                persistOutboxEvents<T extends AnyEntity | AnyEntity[]>(
                    props: PersistOutboxEvents.Props<T>,
                ): PersistOutboxEvents.Result;
                executeWithEffects<T extends AnyEntity | AnyEntity[]>(
                    props: ExecuteWithEffects.Props<T>,
                ): ExecuteWithEffects.Result<T>;
            }

            interface Contract extends PublicContract, PrivateContract {}

            type OutboxPayloadMap = {
                [KafkaTopic.REAUTHENTICATION]: Topics.Reauthentication.Message["payload"];
                [KafkaTopic.SERVICE_CLIENT]: Topics.ServiceClient.Message["payload"];
                [KafkaTopic.BLACKLIST]: Topics.Blacklist.Message["payload"];
                [KafkaTopic.ACCOUNT]: Topics.Account.Message["payload"];
            };

            type MappedOutboxConfig<T> = {
                [D in keyof OutboxPayloadMap]: {
                    payloadMapper?(result: T): OutboxPayloadMap[D] | OutboxPayloadMap[D][];
                    metadata?: UnknownObject;
                    destinationTopic: D;
                    actionType: string;
                };
            }[keyof OutboxPayloadMap];

            type UnmappedOutboxConfig<T> = {
                destinationTopic: Exclude<KafkaTopic, keyof OutboxPayloadMap>;
                payloadMapper?(result: T): AnyEntity | AnyEntity[];
                metadata?: UnknownObject;
                actionType: string;
            };

            type OutboxConfig<T> = MappedOutboxConfig<T> | UnmappedOutboxConfig<T>;

            namespace Emit {
                type Props = {
                    [D in keyof OutboxPayloadMap]: {
                        audit?: Entities.AuditLog.ConstructorProps;
                        payload: OutboxPayloadMap[D];
                        metadata?: UnknownObject;
                        destinationTopic: D;
                        actionType: string;
                        resource?: string;
                    };
                }[keyof OutboxPayloadMap];

                type Result = Promise<void>;
            }

            namespace Run {
                type ResultProps<T extends AnyEntity | AnyEntity[]> = {
                    execute(transaction: EntityManager): Promise<T> | T;
                    audit?: Entities.AuditLog.ConstructorProps;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: EntityManager): Promise<void> | void;
                    audit?: Entities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends AnyEntity | AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            namespace ExecuteWithEffects {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                };

                type Result<T> = Promise<T | void>;
            }

            namespace PersistOutboxEvents {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                    result: T;
                };

                type Result = void;
            }

            namespace BuildAuditLogArchiveOutbox {
                type Props = Entities.AuditLog;

                type Result = Entities.Outbox;
            }
        }
    }
}
