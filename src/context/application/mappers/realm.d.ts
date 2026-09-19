declare namespace Commands {
    namespace Mappers {
        namespace Realm {
            interface Contract extends PublicContract {}

            interface PublicContract {
                interfaceClientPayload: InterfaceClientPayload.Signature;
                serviceClientPayload: ServiceClientPayload.Signature;
            }

            namespace ClientPayload {
                type Props = {
                    interfaceClients: Entities.InterfaceClient[];
                    serviceClients: Entities.ServiceClient[];
                    isRevoked: boolean;
                    actor: string;
                };
            }

            namespace InterfaceClientPayload {
                type Props = ClientPayload.Props;

                type Result = InterfaceClient.InterfaceClientPayload.Result;

                type Signature = (props: Props) => Result;
            }

            namespace ServiceClientPayload {
                type Props = ClientPayload.Props;

                type Result = ServiceClient.ServiceClientPayload.Result;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
