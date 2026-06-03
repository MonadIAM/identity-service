import { Inject, Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { AccountTopicAction } from "@liam/contracts";
import { Job } from "bullmq";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories/tokens";
import { CleanupJob, KafkaTopic, AccountStatus } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";

import { CLEANUP_QUEUE } from "../tokens";
import { BullQueue } from "../enums";

@Injectable()
@Processor(BullQueue.CLEANUP)
export class CleanupProcessor extends WorkerHost {
    private readonly logger = new Logger(CleanupProcessor.name);
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
    ) {
        super();
    }

    private readonly handlers: Record<CleanupJob, Queues.Cleanup.Handler> = {
        [CleanupJob.INACTIVE_ACCOUNTS]: (job: Job) => this.cleanupInactiveAccounts(job),
        [CleanupJob.PENDING_ACCOUNTS]: (job: Job) => this.cleanupPendingAccounts(job),
    };

    public process(job: Job): Promise<Queues.Cleanup.Result> {
        return this.handlers[job.name as CleanupJob]?.(job);
    }

    private async cleanupPendingAccounts(job: Job<Queues.Cleanup.JobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up pending accounts older than ${expirationDate.toISOString()}`);

        try {
            const purged = await this.transactionalService.run({
                resource: this.resource,
                execute: async (transaction) => {
                    const accounts = await this.accountRepository.findExpiredPending({
                        expirationDate,
                        transaction,
                        batchSize,
                    });

                    const purged: Entities.Account[] = [];

                    for (const account of accounts) {
                        if (account.status !== AccountStatus.SUSPENDED) {
                            transaction.remove(account);
                            purged.push(account);
                        }
                    }

                    return purged;
                },
            });

            if (purged.length) {
                this.logger.log(`Deleted ${purged.length} pending accounts.`);
                return this.scheduleNextBatch(job, purged.length === batchSize);
            } else {
                this.logger.log("No pending accounts to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up pending accounts", error);
            throw error;
        }
    }

    private async cleanupInactiveAccounts(job: Job<Queues.Cleanup.JobData>): Promise<Queues.Cleanup.Result> {
        const { olderThanMs, batchSize } = job.data;

        const expirationDate = new Date(Date.now() - olderThanMs);
        this.logger.log(`Cleaning up inactive accounts older than ${expirationDate.toISOString()}`);

        try {
            const { fetched, purged } = await this.transactionalService.run<
                Record<"fetched" | "purged", Entities.Account[]>
            >({
                resource: this.resource,
                outbox: {
                    destinationTopic: KafkaTopic.ACCOUNT,
                    actionType: AccountTopicAction.PURGE,
                    payloadMapper: ({ purged }) => purged.map(({ id }) => ({ account: id })),
                },
                execute: async (transaction) => {
                    const fetched = await this.accountRepository.findExpiredInactive({
                        expirationDate,
                        transaction,
                        batchSize,
                    });

                    const purged: Entities.Account[] = [];

                    for (const account of fetched) {
                        if (account.status !== AccountStatus.SUSPENDED) {
                            transaction.remove(account);
                            purged.push(account);
                        }
                    }

                    return { fetched, purged };
                },
            });

            if (fetched.length) {
                this.logger.log(`Deleted ${purged.length} inactive accounts.`);
                return this.scheduleNextBatch(job, fetched.length === batchSize);
            } else {
                this.logger.log("No inactive accounts to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up inactive accounts", error);
            throw error;
        }
    }

    private async scheduleNextBatch(job: Job<Queues.Cleanup.JobData>, hasMore: boolean): Promise<Queues.Cleanup.Result> {
        if (hasMore) {
            await this.cleanupQueue.scheduleNextBatch(job.name as CleanupJob, job.data);
            this.logger.log("Next batch scheduled in 5 seconds...");
        }
        return { deleted: 0, nextBatch: hasMore };
    }
}
