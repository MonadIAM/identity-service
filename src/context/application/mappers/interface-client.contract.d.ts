declare namespace Commands.Mappers.InterfaceClient {
    interface Contract extends PublicContract {}

    interface PublicContract {
        interfaceClientPayload: InterfaceClientPayload.Signature;
    }

    namespace InterfaceClientPayload {
        type Props = {
            entities: Entities.InterfaceClient[];
            isRevoked: boolean;
            actor: string;
        };

        type Result = Topics.InterfaceClient.Message["payload"][];

        type Signature = (props: Props) => Result;
    }
}
