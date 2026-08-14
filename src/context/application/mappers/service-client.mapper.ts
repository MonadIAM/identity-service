export class ServiceClientMapper implements Commands.Mappers.ServiceClient.Contract {
    public serviceClientPayload(
        props: Commands.Mappers.ServiceClient.ServiceClientPayload.Props,
    ): Commands.Mappers.ServiceClient.ServiceClientPayload.Result {
        const { actor } = props;

        if (Array.isArray(props.serviceClients)) {
            return props.serviceClients.map(({ id, application, code }) => ({
                input: { application: application.id, code, id },
                realm: application.realm,
                actor,
            }));
        } else {
            const { id, application, code } = props.serviceClients;
            return {
                input: { application: application.id, code, id },
                realm: application.realm,
                actor,
            };
        }
    }
}
