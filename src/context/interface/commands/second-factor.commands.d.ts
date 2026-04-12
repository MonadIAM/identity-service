declare namespace Commands {
    namespace SecondFactor {
        interface Contract {
            verify: (props: Verify.Props) => Promise<Verify.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            purge: (props: Purge) => Promise<MessageResult>;
            reset: (props: Reset) => Promise<MessageResult>;
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

        type Purge = {
            context: Extract.Meta;
            actor: string;
            input: {
                factor: string;
            };
        };

        type Reset = {
            context: Extract.Meta;
            input: {
                identifier: string;
                code: string;
            };
        };
    }
}
