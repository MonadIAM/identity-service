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
                };

                type Result = {
                    application: string;
                    realm: string;
                    isRevoked: boolean;
                    id: string;
                }[];

                type Signature = (props: Props) => Result;
            }

            namespace ServiceClientOutboxPayload {
                type Props = {
                    entities: Entities.Application[];
                };

                type Result = {
                    application: string;
                    code: string;
                    id: string;
                }[];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
