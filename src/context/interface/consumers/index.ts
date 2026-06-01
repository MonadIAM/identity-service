import { AccessCacheInvalidationConsumer } from "./access-cache-invalidation.consumer";
import { ElevatedAccessConsumer } from "./elevated-access.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [AccessCacheInvalidationConsumer, BlacklistConsumer, ElevatedAccessConsumer, RetryConsumer];

export { AccessCacheInvalidationConsumer, BlacklistConsumer, ElevatedAccessConsumer, RetryConsumer };
