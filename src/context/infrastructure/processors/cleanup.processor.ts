import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Job, Queue } from "bullmq";

import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { AggregateType, EventType, CleanupJob, KafkaTopic, AccountStatus } from "~context/enums";
import { Account } from "~context/domain/entities";

@Injectable()
@Processor("cleanup")
export class CleanupProcessor extends WorkerHost {
    private readonly logger = new Logger(CleanupProcessor.name);
    private readonly resource = "Account";
    private readonly schema = "identity";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @InjectQueue("cleanup")
        private readonly cleanupQueue: Queue,
    ) {
        super();
    }

    private readonly handlers: Record<CleanupJob, Processors.Cleanup.Handler> = {
        [CleanupJob.INACTIVE_ACCOUNTS]: (job: Job) => this.cleanupInactiveAccounts(job),
        [CleanupJob.PENDING_ACCOUNTS]: (job: Job) => this.cleanupPendingAccounts(job),
    };

    public process(job: Job): Promise<Processors.Cleanup.Result> {
        return this.handlers[job.name as CleanupJob]?.(job);
    }

    private async cleanupPendingAccounts(job: Job): Promise<Processors.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const builder = this.writeManager.getKnex();
        const expirationDate = new Date(Date.now() - olderThanMs);

        this.logger.log(`Cleaning up pending accounts older than ${expirationDate.toISOString()}`);

        try {
            const ids = await builder(`${this.schema}.account`)
                .select("id")
                .where("status", "pending")
                .andWhere("created_at", "<", expirationDate)
                .limit(batchSize);

            if (ids.length) {
                const accountIds = ids.map(({ id }) => id);

                const deletedCount = await builder(`${this.schema}.account`).whereIn("id", accountIds).delete();

                this.logger.log(`Deleted ${deletedCount} pending accounts.`);

                return this.scheduleNextBatch(job, ids.length === batchSize);
            } else {
                this.logger.log("No pending accounts to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up pending accounts", error);
            throw error;
        }
    }

    private async cleanupInactiveAccounts(job: Job): Promise<Processors.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);

        this.logger.log(`Cleaning up inactive accounts older than ${expirationDate.toISOString()}`);

        try {
            const rows = await this.writeManager
                .getKnex()(`${this.schema}.account`)
                .select("*")
                .where("status", "active")
                .andWhereRaw("COALESCE(last_active_at, updated_at, created_at) < ?", [expirationDate])
                .limit(batchSize);

            if (!rows.length) {
                this.logger.log("No inactive accounts to clean up.");
                return { deleted: 0, nextBatch: false };
            }

            const accounts = rows.map((row) => this.writeManager.map(Account, row));

            const result = await this.transactionalService.run<Entities.Account[]>({
                resource: this.resource,
                outbox: {
                    aggregateType: AggregateType.ACCOUNT,
                    destinationTopic: KafkaTopic.ACCOUNT,
                    eventType: EventType.ACCOUNT_PURGED,
                    payloadMapper: (accounts) => accounts.map(({ id }) => ({ accountId: id })),
                },
                execute: (transaction) => {
                    accounts.map((account) => transaction.merge(Account, account));
                    const result: Entities.Account[] = [];

                    for (const account of accounts) {
                        if (account.status !== AccountStatus.SUSPENDED) {
                            transaction.remove(account);
                            result.push(account);
                        }
                    }

                    return result;
                },
            });

            this.logger.log(`Deleted ${result.length} inactive accounts.`);

            return this.scheduleNextBatch(job, rows.length === batchSize);
        } catch (error) {
            this.logger.error("Failed to clean up inactive accounts", error);
            throw error;
        }
    }

    private async scheduleNextBatch(job: Job, hasMore: boolean): Promise<Processors.Cleanup.Result> {
        if (hasMore) {
            await this.cleanupQueue.add(job.name, job.data, {
                attempts: 3,
                delay: 5000,
                backoff: {
                    type: "exponential",
                    delay: 10000,
                },
                removeOnComplete: true,
            });

            this.logger.log("Next batch scheduled in 5 seconds...");
        }

        return { deleted: 0, nextBatch: hasMore };
    }
}
