declare namespace Unit.Commands.InterfaceClient {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.InterfaceClient.Contract;
            interfaceClientService: Jest.Mocked<
                Pick<Services.InterfaceClient.CommandContract, "restore" | "create" | "update" | "revoke" | "purge">
            >;
        };

        type Signature = () => Result;
    }
}
