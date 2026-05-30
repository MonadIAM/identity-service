import { Provider } from "@nestjs/common";

import { KafkaRetryProcessor, KafkaRetryQueue } from "./kafka-retry";
import { CleanupProcessor, CleanupQueue } from "./cleanup";
import { KAFKA_RETRY_QUEUE, CLEANUP_QUEUE } from "./tokens";

export const QUEUES: Provider[] = [
    KafkaRetryProcessor,
    CleanupProcessor,
    {
        provide: KAFKA_RETRY_QUEUE,
        useClass: KafkaRetryQueue,
    },
    {
        provide: CLEANUP_QUEUE,
        useClass: CleanupQueue,
    },
];

export { BullQueue } from "./enums";
export { KAFKA_RETRY_QUEUE, CLEANUP_QUEUE };
