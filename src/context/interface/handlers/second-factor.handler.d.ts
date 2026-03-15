declare namespace Handlers {
    namespace SecondFactor {
        interface Contract {
            setup: (props: Setup.Props) => Promise<Setup.Result>;
            confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
            remove: (props: Remove) => Promise<MessageResult>;
        }

        namespace Setup {
            type Props = {
                context: RequestContext;
                input: {
                    account: string;
                };
            };
            type Result = {
                uri: string;
            };
        }

        namespace Confirm {
            type Props = {
                context: RequestContext;
                input: {
                    totpCode: string;
                    account: string;
                    name: string;
                };
            };
            type Result = {
                data: { masterCode: string };
                message: string;
            };
        }

        type Remove = {
            context: RequestContext;
            input: {
                masterCode: string;
                totpCode: string;
                account: string;
                reason: string;
            };
        };

        type EnableEnforce = {
            context: RequestContext;
            input: {
                account: string;
            };
        };

        type DisableEnforce = {
            context: RequestContext;
            input: {
                totpCode: string;
                account: string;
            };
        };
    }
}
