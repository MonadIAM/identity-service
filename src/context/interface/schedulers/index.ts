import { Provider } from "@nestjs/common";

import { CleanupScheduler } from "./cleanup.scheduler";
import { CLEANUP_SCHEDULER } from "./tokens";

export const SCHEDULERS: Provider[] = [
    {
        provide: CLEANUP_SCHEDULER,
        useClass: CleanupScheduler,
    },
];

export { CLEANUP_SCHEDULER };
