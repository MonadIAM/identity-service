declare namespace Unit.Commands.Profile {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.Profile.Contract;
            profileService: Jest.Mocked<Pick<Services.Profile.CommandContract, "update">>;
        };

        type Signature = () => Result;
    }
}
