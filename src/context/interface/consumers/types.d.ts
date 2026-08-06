import { RealmTopicAction } from "@monadiam/shared";
import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Consumers {
        namespace Realm {
            type Message = Topics.Realm.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }

            type Handlers = {
                [K in RealmTopicAction]: (payload: Topics.Realm.Message["payload"]) => Promise<void>;
            };
        }

        namespace AccessCache {
            type Message = Topics.AccessCache.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }

        namespace Blacklist {
            type Message = Topics.Blacklist.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Reauthentication {
            type Message = Topics.Reauthentication.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message) => Result;
            }
        }

        namespace Membership {
            type Message = Topics.Membership.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }

        namespace Retry {
            type Message = Consumers.DLQ.Message;

            interface Contract extends PublicContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, ctx: KafkaContext) => Result;
            }
        }
    }
}
