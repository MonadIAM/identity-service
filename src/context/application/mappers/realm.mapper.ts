import { InterfaceClientMapper } from "./interface-client.mapper";
import { ServiceClientMapper } from "./service-client.mapper";

export class RealmMapper implements Commands.Mappers.Realm.Contract {
    public interfaceClientPayload(
        props: Commands.Mappers.Realm.InterfaceClientPayload.Props,
    ): Commands.Mappers.Realm.InterfaceClientPayload.Result {
        return new InterfaceClientMapper().interfaceClientPayload({
            entities: props.interfaceClients,
            isRevoked: props.isRevoked,
            actor: props.actor,
        });
    }

    public serviceClientPayload(
        props: Commands.Mappers.Realm.ServiceClientPayload.Props,
    ): Commands.Mappers.Realm.ServiceClientPayload.Result {
        return new ServiceClientMapper().serviceClientPayload({
            serviceClients: props.isRevoked
                ? props.serviceClients
                : props.serviceClients.filter((client) => !client.isRevoked),
            actor: props.actor,
        });
    }
}
