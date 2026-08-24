import { KafkaTopic } from "~context/enums";

declare global {
    namespace SystemEntities {
        type Outbox = Outbox.Contract;

        namespace Outbox {
            interface Contract {
                sequenceNumber: number;

                id: string;
                createdAt: Date;

                destinationTopic: KafkaTopic;
                actionType: string;

                metadata?: UnknownObject;
                payload: UnknownObject;
            }

            type ConstructorProps = {
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                payload: UnknownObject;
                actionType: string;
            };
        }
    }
}
