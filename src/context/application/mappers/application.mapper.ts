export class ApplicationMapper implements Mappers.Application.Contract {
    public interfaceClientOutboxPayload(
        props: Mappers.Application.InterfaceClientOutboxPayload.Props,
    ): Mappers.Application.InterfaceClientOutboxPayload.Result {
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
        props: Mappers.Application.ServiceClientOutboxPayload.Props,
    ): Mappers.Application.ServiceClientOutboxPayload.Result {
        return props.entities.flatMap((application) =>
            application.serviceClients.getItems().map((client) => ({
                application: application.id,
                code: client.code,
                id: client.id,
            })),
        );
    }
}
