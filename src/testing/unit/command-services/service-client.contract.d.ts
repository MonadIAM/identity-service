declare namespace Unit.Commands.ServiceClient {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.ServiceClient.Contract;
            serviceClientService: Jest.Mocked<
                Pick<Services.ServiceClient.CommandContract, "restore" | "create" | "update" | "revoke" | "purge">
            >;
        };

        type Signature = () => Result;
    }
}
