import { ReauthenticationConsumer } from "./reauthentication.consumer";
import { AccessCacheConsumer } from "./access-cache.consumer";
import { BlacklistConsumer } from "./blacklist.consumer";
import { RealmConsumer } from "./realm.consumer";

export const CONSUMERS = [ReauthenticationConsumer, AccessCacheConsumer, BlacklistConsumer, RealmConsumer];

export { ReauthenticationConsumer, AccessCacheConsumer, BlacklistConsumer, RealmConsumer };
