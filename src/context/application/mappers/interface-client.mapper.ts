export class InterfaceClientMapper implements Commands.Mappers.InterfaceClient.Contract {
    public interfaceClientPayload(
        props: Commands.Mappers.InterfaceClient.InterfaceClientPayload.Props,
    ): Commands.Mappers.InterfaceClient.InterfaceClientPayload.Result {
        return props.entities.map(({ id, application }) => ({
            application: application.id,
            isRevoked: props.isRevoked,
            realm: application.realm,
            id,
        }));
    }
}
