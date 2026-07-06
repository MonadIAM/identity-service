import { RealmTopicAction } from "@monadiam/contracts";
import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Consumers {
        namespace Realm {
            interface Contract {
                handle(message: Message, ctx: KafkaContext): Promise<void>;
            }

            type Message = Topics.Realm.Message;

            type Handlers = {
                [K in RealmTopicAction]: (payload: Topics.Realm.Message["payload"]) => Promise<void>;
            };
        }

        namespace AccessCache {
            interface Contract {
                handle(message: Message, ctx: KafkaContext): Promise<void>;
            }

            type Message = Topics.AccessCache.Message;
        }

        namespace Blacklist {
            interface Contract {
                handle(message: Message): Promise<void>;
            }

            type Message = Topics.Blacklist.Message;
        }

        namespace Reauthentication {
            interface Contract {
                handle(message: Message): Promise<void>;
            }

            type Message = Topics.Reauthentication.Message;
        }

        namespace Membership {
            interface Contract {
                handle(message: Message, ctx: KafkaContext): Promise<void>;
            }

            type Message = Topics.Membership.Message;
        }
    }
}
