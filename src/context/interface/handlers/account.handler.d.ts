declare namespace Handlers {
    namespace Account {
        interface Contract {
            deactivate: (props: Deactivate) => Promise<MessageResult>;
            unsuspend: (props: Unsuspend) => Promise<MessageResult>;
            suspend: (props: Suspend) => Promise<MessageResult>;
        }

        type Deactivate = {
            context: RequestContext;
            actor: string;
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
