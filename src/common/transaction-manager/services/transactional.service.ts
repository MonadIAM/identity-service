import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";
import { AuditLogTopicAction } from "@monadiam/contracts";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

import { ExceptionMapper } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

import { OperationContext } from "../utilities/operation-context";
import { AuditLog } from "../entities/audit-log.entity";
import { Outbox } from "../entities";

@Injectable()
export class TransactionalService {
    private readonly serviceName: string;

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public async emit(params: TransactionManager.Service.Emit): Promise<void> {
        try {
            const writeManager = this.writeManager.fork();
            const outbox = new Outbox(params);

            if (params.audit) {
                const auditEntry = new AuditLog(params.audit);
                return await this.operationContext.run({ changeLogEnabled: false, auditEntry: auditEntry.id }, () =>
                    writeManager.transactional(async (transaction) => {
                        transaction.persist(auditEntry);
                        transaction.persist(this.buildAuditLogArchiveOutbox(auditEntry));
                        transaction.persist(outbox);
                        await transaction.flush();
                    }),
                );
            } else {
                return writeManager.transactional(async (transaction) => {
                    transaction.persist(outbox);
                    await transaction.flush();
                });
            }
        } catch (error) {
            throw ExceptionMapper.fromORM(error, params.resource);
        }
    }

    public async run<T extends AnyEntity>(params: TransactionManager.Service.Run<T>): Promise<T | void> {
        try {
            const writeManager = this.writeManager.fork();

            if (!params.audit) {
                return writeManager.transactional(async (transaction) => {
                    const result = await params.execute(transaction);

                    if (params.outbox && result) {
                        const mapped = params.outbox.payloadMapper(result);
                        const payloads = Array.isArray(mapped) ? mapped : [mapped];
                        for (const payload of payloads) {
                            transaction.persist(new Outbox({ ...params.outbox, payload }));
                        }
                    }

                    await transaction.flush();

                    return result;
                });
            }

            const auditEntry = new AuditLog(params.audit);

            return await this.operationContext.run(
                {
                    changeLogEnabled: params.changeLog ?? false,
                    auditEntry: auditEntry.id,
                },
                () =>
                    writeManager.transactional(async (transaction) => {
                        transaction.persist(auditEntry);
                        transaction.persist(this.buildAuditLogArchiveOutbox(auditEntry));

                        const result = await params.execute(transaction);

                        if (params.outbox && result) {
                            const mapped = params.outbox.payloadMapper(result);
                            const payloads = Array.isArray(mapped) ? mapped : [mapped];
                            for (const payload of payloads) {
                                transaction.persist(new Outbox({ ...params.outbox, payload }));
                            }
                        }

                        await transaction.flush();

                        return result;
                    }),
            );
        } catch (error) {
            throw ExceptionMapper.fromORM(error, params.resource);
        }
    }

    private buildAuditLogArchiveOutbox(auditEntry: AuditLog): Outbox {
        return new Outbox({
            destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
            actionType: AuditLogTopicAction.ARCHIVE,
            payload: {
                id: auditEntry.id,
                service: this.serviceName,
                created_at: auditEntry.createdAt.toISOString(),
                action_type: auditEntry.actionType,
                entity_type: auditEntry.entityType,
                actor: auditEntry.actor ?? null,
                ip: auditEntry.ip ?? null,
                user_agent: auditEntry.userAgent ?? null,
                input: auditEntry.input ? JSON.stringify(auditEntry.input) : null,
            },
        });
    }
}
