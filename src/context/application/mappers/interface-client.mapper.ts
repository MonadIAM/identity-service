export class InterfaceClientMapper implements Commands.Mappers.InterfaceClient.Contract {
    public interfaceClientPayload(
        props: Commands.Mappers.InterfaceClient.InterfaceClientPayload.Props,
    ): Commands.Mappers.InterfaceClient.InterfaceClientPayload.Result {
        return props.entities.map(({ id, application }) => ({
            realm: application.realm,
            actor: props.actor,
            input: {
                application: application.id,
                isRevoked: props.isRevoked,
                id,
            },
        }));
    }
}
