import { ElevatedAccessConsumer } from "./elevated-access.consumer";
import { MembershipConsumer } from "./membership.consumer";
import { AccessCacheConsumer } from "./access-cache.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [
    ElevatedAccessConsumer,
    AccessCacheConsumer,
    MembershipConsumer,
    BlacklistConsumer,
    RetryConsumer,
];

export { AccessCacheConsumer, BlacklistConsumer, ElevatedAccessConsumer, MembershipConsumer, RetryConsumer };
