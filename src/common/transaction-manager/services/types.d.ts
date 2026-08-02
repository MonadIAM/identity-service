import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface PublicContract {
                run<T extends ORM.AnyEntity | ORM.AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
                emit(props: Emit.Props): Emit.Result;
            }

            interface InternalContract {
                buildAuditLogArchiveOutbox(props: BuildAuditLogArchiveOutbox.Props): BuildAuditLogArchiveOutbox.Result;
                persistOutboxEvents<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
                    props: PersistOutboxEvents.Props<T>,
                ): PersistOutboxEvents.Result;
                executeWithEffects<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
                    props: ExecuteWithEffects.Props<T>,
                ): ExecuteWithEffects.Result<T>;
            }

            interface Contract extends PublicContract, InternalContract {}

            type OutboxPayloadMap = {
                [KafkaTopic.REAUTHENTICATION]: Topics.Reauthentication.Message["payload"];
                [KafkaTopic.SERVICE_CLIENT]: Topics.ServiceClient.Message["payload"];
                [KafkaTopic.NOTIFICATION]: Topics.Notification.Message["payload"];
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
                payloadMapper?(result: T): ORM.AnyEntity | ORM.AnyEntity[];
                metadata?: UnknownObject;
                actionType: string;
            };

            type OutboxConfig<T> = MappedOutboxConfig<T> | UnmappedOutboxConfig<T>;

            namespace Emit {
                type Props = {
                    [D in keyof OutboxPayloadMap]: {
                        audit?: SystemEntities.AuditLog.ConstructorProps;
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
                type ResultProps<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    execute(transaction: ORM.EntityManager): Promise<T> | T;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: ORM.EntityManager): Promise<void> | void;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            namespace ExecuteWithEffects {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                };

                type Result<T> = Promise<T | void>;
            }

            namespace PersistOutboxEvents {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                    result: T;
                };

                type Result = void;
            }

            namespace BuildAuditLogArchiveOutbox {
                type Props = SystemEntities.AuditLog;

                type Result = SystemEntities.Outbox;
            }
        }
    }
}
