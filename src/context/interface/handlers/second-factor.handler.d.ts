declare namespace Handlers {
    namespace SecondFactor {
        interface Contract {
            resetByMasterCode: (props: ResetByMasterCode) => Promise<MessageResult>;
            disableEnforce: (props: DisableEnforce) => Promise<MessageResult>;
            enableEnforce: (props: EnableEnforce) => Promise<MessageResult>;
            confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
            setup: (props: Setup.Props) => Promise<Setup.Result>;
            remove: (props: Remove) => Promise<MessageResult>;
        }

        namespace Setup {
            type Props = {
                context: RequestContext;
                actor: string;
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
                actor: string;
                input: {
                    totpCode: string;
                    account: string;
                    name: string;
                };
            };
            type Result = {
                masterCode: string;
                message: string;
            };
        }

        type Remove = {
            context: RequestContext;
            actor: string;
            input: {
                masterCode?: string;
                totpCode?: string;
                account: string;
                reason: string;
            };
        };

        type EnableEnforce = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
            };
        };

        type DisableEnforce = {
            context: RequestContext;
            actor: string;
            input: {
                totpCode: string;
                account: string;
            };
        };

        type ResetByMasterCode = {
            context: RequestContext;
            actor: string;
            input: {
                identifier: string;
                masterCode: string;
            };
        };
    }
}
