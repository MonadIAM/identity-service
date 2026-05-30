import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { Inject, Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";

import { CleanupJob } from "~context/enums";
import { CLEANUP_QUEUE } from "~context/infrastructure/queues";

@Injectable()
export class CleanupScheduler {
    private readonly inactiveAccountTTL: StringValue;
    private readonly pendingAccountTTL: StringValue;
    private readonly batchSize: number;

    public constructor(
        @Inject(CLEANUP_QUEUE)
        private readonly cleanupQueue: Queues.Cleanup.Contract,
        private readonly configService: ConfigService,
    ) {
        this.inactiveAccountTTL = this.configService.getOrThrow<StringValue>("INACTIVE_ACCOUNT_TTL");
        this.pendingAccountTTL = this.configService.getOrThrow<StringValue>("PENDING_ACCOUNT_TTL");
        this.batchSize = this.configService.getOrThrow<number>("CLEANUP_BATCH_SIZE");
    }

    @Cron(CronExpression.EVERY_HOUR)
    public async schedulePendingAccountsCleanup(): Promise<void> {
        await this.cleanupQueue.schedule(CleanupJob.PENDING_ACCOUNTS, {
            olderThanMs: ms(this.pendingAccountTTL),
            batchSize: this.batchSize,
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    public async scheduleInactiveAccountsCleanup(): Promise<void> {
        await this.cleanupQueue.schedule(CleanupJob.INACTIVE_ACCOUNTS, {
            olderThanMs: ms(this.inactiveAccountTTL),
            batchSize: this.batchSize,
        });
    }
}
