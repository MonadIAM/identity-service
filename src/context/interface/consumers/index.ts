import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { MembershipConsumer } from "./membership.consumer";
import { AccessCacheConsumer } from "./access-cache.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RealmConsumer } from "./realm.consumer";
import { RetryConsumer } from "./retry.consumer";

export const CONSUMERS = [
    ReauthenticationConsumer,
    AccessCacheConsumer,
    MembershipConsumer,
    BlacklistConsumer,
    RealmConsumer,
    RetryConsumer,
];

export {
    AccessCacheConsumer,
    BlacklistConsumer,
    ReauthenticationConsumer,
    MembershipConsumer,
    RealmConsumer,
    RetryConsumer,
};
