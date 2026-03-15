declare namespace Handlers {
    namespace Account {
        interface Contract {
            regenerateRecoveryCodes: (props: RegenerateRecoveryCodes.Props) => Promise<RegenerateRecoveryCodes.Result>;
            deactivate: (props: Deactivate) => Promise<MessageResult>;
            unsuspend: (props: Unsuspend) => Promise<MessageResult>;
            suspend: (props: Suspend) => Promise<MessageResult>;
        }

        namespace RegenerateRecoveryCodes {
            type Props = {
                context: RequestContext;
                input: {
                    password: string;
                    account: string;
                };
            };
            type Result = MessageResult & {
                data: { recoveryCodes: string[] };
            };
        }

        type Deactivate = {
            context: RequestContext;
            input: {
                password: string;
                account: string;
            };
        };

        type Suspend = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
                reason: string;
            };
        };

        type Unsuspend = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
                reason: string;
            };
        };
    }
}
