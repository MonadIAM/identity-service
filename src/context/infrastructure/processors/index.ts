import { Provider } from "@nestjs/common";

import { CleanupProcessor } from "./cleanup.processor";
import { CLEANUP_PROCESSOR } from "./tokens";

export const PROCESSORS: Provider[] = [
    {
        provide: CLEANUP_PROCESSOR,
        useClass: CleanupProcessor,
    },
];

export { CLEANUP_PROCESSOR };
