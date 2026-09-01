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

                envelope: Envelope.Signature;
            }

            namespace Envelope {
                type Result = {
                    actionType: string;
                    payload: UnknownObject;
                };

                type Signature = () => Result;
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
