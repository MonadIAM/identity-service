declare namespace Unit.Commands.Realm {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.Realm.Contract;
            interfaceClientService: Jest.Mocked<
                Pick<Services.InterfaceClient.CommandContract, "purgeRealm" | "applyRealmRevocation" | "applyRealmRestore">
            >;
            serviceClientService: Jest.Mocked<
                Pick<Services.ServiceClient.CommandContract, "purgeRealm" | "applyRealmRevocation" | "applyRealmRestore">
            >;
        };

        type Signature = () => Result;
    }
}
