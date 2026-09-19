export class ServiceClientMapper implements Commands.Mappers.ServiceClient.Contract {
    public serviceClientPayload(
        props: Commands.Mappers.ServiceClient.ServiceClientPayload.Props,
    ): Commands.Mappers.ServiceClient.ServiceClientPayload.Result {
        const { actor } = props;

        if (Array.isArray(props.serviceClients)) {
            return props.serviceClients.map(({ id, realm, code }) => ({
                input: { code, id },
                realm,
                actor,
            }));
        } else {
            const { id, realm, code } = props.serviceClients;
            return {
                input: { code, id },
                realm,
                actor,
            };
        }
    }
}
