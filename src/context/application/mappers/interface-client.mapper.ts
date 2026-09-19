export class InterfaceClientMapper implements Commands.Mappers.InterfaceClient.Contract {
    public interfaceClientPayload(
        props: Commands.Mappers.InterfaceClient.InterfaceClientPayload.Props,
    ): Commands.Mappers.InterfaceClient.InterfaceClientPayload.Result {
        return props.entities.map(({ id, realm, isRevoked, isRealmRevoked }) => ({
            realm,
            actor: props.actor,
            input: {
                isRevoked: props.isRevoked || isRevoked || isRealmRevoked,
                id,
            },
        }));
    }
}
