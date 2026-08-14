declare namespace Commands {
    namespace Mappers {
        namespace Application {
            interface Contract extends PublicContract {}

            interface PublicContract {
                interfaceClientOutboxPayload: InterfaceClientOutboxPayload.Signature;
                serviceClientOutboxPayload: ServiceClientOutboxPayload.Signature;
            }

            namespace InterfaceClientOutboxPayload {
                type Props = {
                    entities: Entities.Application[];
                    isRevoked: boolean;
                    actor: string;
                };

                type Result = Topics.InterfaceClient.Message["payload"][];

                type Signature = (props: Props) => Result;
            }

            namespace ServiceClientOutboxPayload {
                type Props = {
                    entities: Entities.Application[];
                    actor: string;
                };

                type Result = Topics.ServiceClient.Message["payload"][];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
