import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Logger } from "@nestjs/common";
import { Job, Queue } from "bullmq";

@Injectable()
@Processor("cleanup")
export class CleanupProcessor extends WorkerHost {
    private readonly logger = new Logger(CleanupProcessor.name);
    private readonly schema = "identity";

    public constructor(
        @InjectQueue("cleanup")
        private readonly cleanupQueue: Queue,
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
    ) {
        super();
    }

    public process(job: Job): Promise<Processors.Cleanup.Result> {
        switch (job.name) {
            case "cleanup-pending-accounts":
                return this.cleanupPendingAccounts(job);
            case "cleanup-expired-sessions":
                return this.cleanupExpiredSessions(job);
            case "cleanup-expired-notifications":
                return this.cleanupExpiredNotifications(job);
            default:
                throw new Error(`Unknown cleanup job: ${job.name}`);
        }
    }

    private async cleanupPendingAccounts(job: Job): Promise<Processors.Cleanup.Result> {
        const { olderThanHours, batchSize } = job.data;

        const builder = this.writeManager.getKnex();
        const expirationDate = new Date();

        expirationDate.setHours(expirationDate.getHours() - olderThanHours);

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

    private async cleanupExpiredSessions(job: Job): Promise<Processors.Cleanup.Result> {
        const { batchSize } = job.data;

        const builder = this.writeManager.getKnex();
        const now = new Date();

        this.logger.log(`Cleaning up sessions expired before ${now.toISOString()}`);

        try {
            const ids = await builder(`${this.schema}.session`).select("id").where("expires_at", "<", now).limit(batchSize);

            if (ids.length) {
                const deletedCount = await builder(`${this.schema}.session`)
                    .whereIn(
                        "id",
                        ids.map(({ id }) => id),
                    )
                    .delete();

                this.logger.log(`Deleted ${deletedCount} expired sessions.`);

                return this.scheduleNextBatch(job, ids.length === batchSize);
            } else {
                this.logger.log("No expired sessions to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up expired sessions", error);
            throw error;
        }
    }

    private async cleanupExpiredNotifications(job: Job): Promise<Processors.Cleanup.Result> {
        const { olderThanDays, batchSize } = job.data;

        const builder = this.writeManager.getKnex();
        const expirationDate = new Date();

        expirationDate.setDate(expirationDate.getDate() - olderThanDays);

        this.logger.log(`Cleaning up notifications older than ${expirationDate.toISOString()}`);

        try {
            const ids = await builder(`${this.schema}.notification`)
                .select("id")
                .where("created_at", "<", expirationDate)
                .limit(batchSize);

            if (ids.length) {
                const deletedCount = await builder(`${this.schema}.notification`)
                    .whereIn(
                        "id",
                        ids.map(({ id }) => id),
                    )
                    .delete();

                this.logger.log(`Deleted ${deletedCount} expired notifications.`);

                return this.scheduleNextBatch(job, ids.length === batchSize);
            } else {
                this.logger.log("No expired notifications to clean up.");
                return { deleted: 0, nextBatch: false };
            }
        } catch (error) {
            this.logger.error("Failed to clean up expired notifications", error);
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
