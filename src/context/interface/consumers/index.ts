import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { MembershipConsumer } from "./membership.consumer";
import { AccessCacheConsumer } from "./access-cache.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [
    ReauthenticationConsumer,
    AccessCacheConsumer,
    MembershipConsumer,
    BlacklistConsumer,
    RetryConsumer,
];

export { AccessCacheConsumer, BlacklistConsumer, ReauthenticationConsumer, MembershipConsumer, RetryConsumer };
