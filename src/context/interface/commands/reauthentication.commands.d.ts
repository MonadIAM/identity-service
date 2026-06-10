declare namespace Commands {
    namespace Reauthentication {
        interface ControllerContract {
            bySecondFactor: (props: BySecondFactor.Props) => BySecondFactor.Result;
            byPassword: (props: ByPassword.Props) => ByPassword.Result;
        }

        interface Contract extends ControllerContract {}

        namespace ByPassword {
            type Props = {
                context: Extract.Meta;
                session: string;
                actor: string;
                input: {
                    password: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace BySecondFactor {
            type Props = {
                context: Extract.Meta;
                session: string;
                actor: string;
                input: {
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;
        }
    }
}
