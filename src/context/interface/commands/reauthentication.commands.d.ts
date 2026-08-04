declare namespace Commands {
    namespace Reauthentication {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            bySecondFactor: BySecondFactor.Signature;
            byPassword: ByPassword.Signature;
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

            type Signature = (props: Props) => Result;
        }

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

            type Signature = (props: Props) => Result;
        }
    }
}
