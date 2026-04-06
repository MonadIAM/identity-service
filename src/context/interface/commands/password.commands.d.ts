declare namespace Commands {
    namespace Password {
        interface Contract {
            requestOTP: (props: RequestOTP) => Promise<MessageResult>;
            change: (props: Change) => Promise<MessageResult>;
            resetByOTP: (props: ResetByOTP) => Promise<MessageResult>;
            resetByRecoveryCode: (props: ResetByRecoveryCode) => Promise<MessageResult>;
        }

        type Change = {
            context: Extract.Meta;
            actor: string;
            input: {
                currentPassword: string;
                newPassword: string;
            };
        };

        type RequestOTP = {
            input: {
                identifier: string;
            };
        };

        type ResetByOTP = {
            context: Extract.Meta;
            input: {
                password: string;
                code: string;
            };
        };

        type ResetByRecoveryCode = {
            context: Extract.Meta;
            input: {
                identifier: string;
                password: string;
                code: string;
            };
        };
    }
}
