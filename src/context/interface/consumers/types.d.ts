import { KafkaContext } from "@nestjs/microservices";

declare global {
    namespace Consumers {
        namespace DLQ {
            type Message = {
                originalTopic: string;
                payload: unknown;
                error: string;
            };
        }

        namespace AccessCacheInvalidation {
            interface Contract {
                handle: (payload: Payload, ctx: KafkaContext) => Promise<void>;
            }

            type Payload = Events.AccessCache.Invalidation;
        }

        namespace Blacklist {
            interface Contract {
                handle: (props: Payload) => Promise<void>;
            }

            type Event = "SESSION_REVOKED";

            type Payload = {
                eventType: Event;
                payload: {
                    sessionId: string;
                    ttl: number;
                };
            };
        }
    }
}
