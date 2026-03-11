import { Provider } from "@nestjs/common";

import { CleanupScheduler } from "./cleanup.scheduler";

export const CLEANUP_SCHEDULER = Symbol("Schedulers.Cleanup");

export const SCHEDULERS: Provider[] = [
    {
        provide: CLEANUP_SCHEDULER,
        useClass: CleanupScheduler,
    },
];
