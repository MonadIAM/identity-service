declare namespace Commands {
    namespace RecoveryCode {
        interface Contract {
            regenerate: (props: Regenerate.Props) => Promise<Regenerate.Result>;
        }

        namespace Regenerate {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = MessageResult & {
                codes: string[];
            };
        }
    }
}
