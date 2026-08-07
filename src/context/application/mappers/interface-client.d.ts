declare namespace Commands {
    namespace Mappers {
        namespace InterfaceClient {
            interface Contract extends PublicContract {}

            interface PublicContract {
                interfaceClientPayload: InterfaceClientPayload.Signature;
            }

            namespace InterfaceClientPayload {
                type Props = {
                    entities: Entities.InterfaceClient[];
                    isRevoked: boolean;
                };

                type Result = {
                    application: string;
                    isRevoked: boolean;
                    realm: string;
                    id: string;
                }[];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
