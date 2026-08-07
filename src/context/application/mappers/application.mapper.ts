export class ApplicationMapper implements Commands.Mappers.Application.Contract {
    public interfaceClientOutboxPayload(
        props: Commands.Mappers.Application.InterfaceClientOutboxPayload.Props,
    ): Commands.Mappers.Application.InterfaceClientOutboxPayload.Result {
        const { entities, isRevoked } = props;

        return entities.flatMap((application) =>
            application.interfaceClients.getItems().map((client) => ({
                application: application.id,
                realm: application.realm,
                id: client.id,
                isRevoked,
            })),
        );
    }

    public serviceClientOutboxPayload(
        props: Commands.Mappers.Application.ServiceClientOutboxPayload.Props,
    ): Commands.Mappers.Application.ServiceClientOutboxPayload.Result {
        return props.entities.flatMap((application) =>
            application.serviceClients.getItems().map((client) => ({
                application: application.id,
                code: client.code,
                id: client.id,
            })),
        );
    }
}
