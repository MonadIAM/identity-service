declare namespace Commands {
    namespace SecondFactor {
        interface Contract {
            create: (props: Create.Props) => Promise<Create.Result>;
            verify: (props: Verify.Props) => Promise<Verify.Result>;
            purge: (props: Purge.Props) => Promise<Purge.Result>;
            reset: (props: Reset.Props) => Promise<Reset.Result>;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    name: string;
                };
            };

            type Result = {
                uri: string;
            };
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

            type Result = MessageResult & {
                code?: string;
            };
        }

        namespace Purge {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    factor: string;
                };
            };

            type Result = MessageResult;
        }

        namespace Reset {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    code: string;
                };
            };

            type Result = MessageResult;
        }
    }
}
