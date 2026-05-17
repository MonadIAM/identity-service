declare namespace Commands {
    namespace SecondFactor {
        interface ControllerContract {
            create: (props: Create.Props) => Create.Result;
            verify: (props: Verify.Props) => Verify.Result;
            purge: (props: Purge.Props) => Purge.Result;
            reset: (props: Reset.Props) => Reset.Result;
        }

        interface Contract extends ControllerContract {}

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    name: string;
                };
            };

            type Result = Promise<{
                uri: string;
            }>;
        }

        namespace Verify {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    factor: string;
                    code: string;
                };
            };

            type Result = Promise<
                MessageResult & {
                    code?: string;
                }
            >;
        }

        namespace Purge {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    factor: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace Reset {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;
        }
    }
}
