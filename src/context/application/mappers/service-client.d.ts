declare namespace Commands {
    namespace Mappers {
        namespace ServiceClient {
            interface Contract extends PublicContract {}

            interface PublicContract {
                serviceClientPayload: ServiceClientPayload.Signature;
            }

            namespace ServiceClientPayload {
                type Props = {
                    serviceClients: Entities.ServiceClient | Entities.ServiceClient[];
                };

                type Result = Topics.ServiceClient.Message["payload"] | Topics.ServiceClient.Message["payload"][];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
