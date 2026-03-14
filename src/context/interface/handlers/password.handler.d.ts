declare namespace Handlers {
    namespace Password {
        interface Contract {
            resetByRecoveryCode: (props: ResetByRecoveryCode) => Promise<MessageResult>;
            requestReset: (props: RequestReset) => Promise<MessageResult>;
            resetByToken: (props: ResetByToken) => Promise<MessageResult>;
            change: (props: Change) => Promise<MessageResult>;
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
