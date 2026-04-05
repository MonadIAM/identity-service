declare namespace Commands {
    namespace SecondFactor {
        interface Contract {
            confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
            create: (props: Create.Props) => Promise<Create.Result>;
            purge: (props: Purge) => Promise<MessageResult>;
            reset: (props: Reset) => Promise<MessageResult>;
        }

        namespace Create {
            type Props = {
                context: RequestContext;
                actor: string;
                input: {
                    name: string;
                };
            };

            type Result = {
                uri: string;
            };
        }

        namespace Confirm {
            type Props = {
                context: RequestContext;
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
            context: RequestContext;
            actor: string;
            input: {
                factor: string;
            };
        };

        type Reset = {
            context: RequestContext;
            input: {
                identifier: string;
                code: string;
            };
        };
    }
}
