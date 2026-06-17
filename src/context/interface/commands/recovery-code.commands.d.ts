declare namespace Commands {
    namespace RecoveryCode {
        interface ControllerContract {
            regenerate(props: Regenerate.Props): Regenerate.Result;
        }

        interface Contract extends ControllerContract {}

        namespace Regenerate {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<
                MessageResult & {
                    codes: string[];
                }
            >;
        }
    }
}
