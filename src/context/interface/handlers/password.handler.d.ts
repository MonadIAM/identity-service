declare namespace Handlers {
    namespace Password {
        interface Contract {
            regenerateRecoveryCodes: (props: RegenerateRecoveryCodes.Props) => Promise<RegenerateRecoveryCodes.Result>;
            resetByRecoveryCode: (props: ResetByRecoveryCode) => Promise<MessageResult>;
            requestResetOTP: (props: RequestResetOTP) => Promise<MessageResult>;
            resetByOTP: (props: ResetByOTP) => Promise<MessageResult>;
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
                recoveryCodes: string[];
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

        type RequestResetOTP = {
            input: {
                identifier: string;
            };
        };

        type ResetByOTP = {
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
