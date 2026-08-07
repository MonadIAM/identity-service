export class InterfaceClientMapper implements Mappers.InterfaceClient.Contract {
    public interfaceClientPayload(
        props: Mappers.InterfaceClient.InterfaceClientPayload.Props,
    ): Mappers.InterfaceClient.InterfaceClientPayload.Result {
        return props.entities.map(({ id, application }) => ({
            application: application.id,
            isRevoked: props.isRevoked,
            realm: application.realm,
            id,
        }));
    }
}
