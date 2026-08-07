export class ServiceClientMapper implements Commands.Mappers.ServiceClient.Contract {
    public serviceClientPayload(
        props: Commands.Mappers.ServiceClient.ServiceClientPayload.Props,
    ): Commands.Mappers.ServiceClient.ServiceClientPayload.Result {
        if (Array.isArray(props.serviceClients)) {
            return props.serviceClients.map(({ id, application, code }) => ({ application: application.id, code, id }));
        } else {
            const { id, application, code } = props.serviceClients;
            return { application: application.id, code, id };
        }
    }
}
