declare namespace Commands.Mappers.ServiceClient {
    interface Contract extends PublicContract {}

    interface PublicContract {
        serviceClientPayload: ServiceClientPayload.Signature;
    }

    namespace ServiceClientPayload {
        type Props = {
            serviceClients: Entities.ServiceClient | Entities.ServiceClient[];
            actor: string;
        };

        type Result = Topics.ServiceClient.Message["payload"] | Topics.ServiceClient.Message["payload"][];

        type Signature = (props: Props) => Result;
    }
}
