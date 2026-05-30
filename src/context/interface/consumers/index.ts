import { AccessCacheInvalidationConsumer } from "./access-cache-invalidation.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [AccessCacheInvalidationConsumer, BlacklistConsumer, RetryConsumer];

export { AccessCacheInvalidationConsumer, BlacklistConsumer, RetryConsumer };
