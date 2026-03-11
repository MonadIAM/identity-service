import { Provider } from "@nestjs/common";

import { CleanupProcessor } from "./cleanup.processor";

export const CLEANUP_PROCESSOR = Symbol("Processors.Cleanup");

export const PROCESSORS: Provider[] = [
    {
        provide: CLEANUP_PROCESSOR,
        useClass: CleanupProcessor,
    },
];
