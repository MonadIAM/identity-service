declare namespace Handlers {
    namespace Password {
        interface Contract {
            regenerateRecoveryCodes: (props: RegenerateRecoveryCodes.Props) => Promise<RegenerateRecoveryCodes.Result>;
            resetByRecoveryCode: (props: ResetByRecoveryCode) => Promise<MessageResult>;
            requestReset: (props: RequestReset) => Promise<MessageResult>;
            resetByToken: (props: ResetByToken) => Promise<MessageResult>;
            change: (props: Change) => Promise<MessageResult>;
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

        type Change = {
            context: RequestContext;
            input: {
                currentPassword: string;
                newPassword: string;
                account: string;
            };
        };

        type RequestReset = {
            input: {
                value: string;
            };
        };

        type ResetByToken = {
            context: RequestContext;
            input: {
                newPassword: string;
                code: string;
            };
        };

        type ResetByRecoveryCode = {
            context: RequestContext;
            input: {
                newPassword: string;
                identifier: string;
                code: string;
            };
        };
    }
}
