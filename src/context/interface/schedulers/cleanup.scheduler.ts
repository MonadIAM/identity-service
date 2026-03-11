import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class CleanupScheduler {
    public constructor(
        @InjectQueue("cleanup") private readonly cleanupQueue: Queue,
        private readonly configService: ConfigService,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    public async schedulePendingAccountsCleanup(): Promise<void> {
        await this.cleanupQueue.add("cleanup-pending-accounts", {
            olderThanHours: this.configService.getOrThrow<number>("PENDING_ACCOUNT_TTL_HOURS"),
            batchSize: this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE"),
        });
    }

    @Cron(CronExpression.EVERY_HOUR)
    public async scheduleExpiredSessionsCleanup(): Promise<void> {
        await this.cleanupQueue.add("cleanup-expired-sessions", {
            batchSize: this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE"),
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    public async scheduleExpiredNotificationsCleanup(): Promise<void> {
        await this.cleanupQueue.add("cleanup-expired-notifications", {
            olderThanDays: this.configService.getOrThrow<number>("NOTIFICATION_TTL_DAYS"),
            batchSize: this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE"),
        });
    }
}
