declare namespace Commands {
    namespace SecondFactor {
        interface Contract {
            create: (props: Create.Props) => Promise<Create.Result>;
            confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
            revoke: (props: Revoke) => Promise<MessageResult>;
            restore: (props: Restore) => Promise<MessageResult>;
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
                masterCode?: string;
            };
        }

        type Revoke = {
            context: RequestContext;
            actor: string;
            input: {
                factor: string;
            };
        };

        type Restore = {
            context: RequestContext;
            actor: string;
            input: {
                factor: string;
            };
        };

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
