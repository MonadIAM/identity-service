declare namespace Commands {
    namespace RecoveryCode {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            regenerate: Regenerate.Signature;
        }

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

            type Signature = (props: Props) => Result;
        }
    }
}
