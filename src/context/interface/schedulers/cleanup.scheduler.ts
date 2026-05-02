import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import { Queue } from "bullmq";

import { CleanupJob } from "~context/enums";

@Injectable()
export class CleanupScheduler {
    private readonly inactiveAccountTTL: StringValue;
    private readonly pendingAccountTTL: StringValue;
    private readonly batchSize: number;

    public constructor(
        @InjectQueue("cleanup")
        private readonly cleanupQueue: Queue,
        private readonly configService: ConfigService,
    ) {
        this.inactiveAccountTTL = this.configService.getOrThrow<StringValue>("INACTIVE_ACCOUNT_TTL");
        this.pendingAccountTTL = this.configService.getOrThrow<StringValue>("PENDING_ACCOUNT_TTL");
        this.batchSize = this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE");
    }

    @Cron(CronExpression.EVERY_HOUR)
    public async schedulePendingAccountsCleanup(): Promise<void> {
        await this.cleanupQueue.add(CleanupJob.PENDING_ACCOUNTS, {
            olderThanMs: ms(this.pendingAccountTTL),
            batchSize: this.batchSize,
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    public async scheduleInactiveAccountsCleanup(): Promise<void> {
        await this.cleanupQueue.add(CleanupJob.INACTIVE_ACCOUNTS, {
            olderThanMs: ms(this.inactiveAccountTTL),
            batchSize: this.batchSize,
        });
    }
}
