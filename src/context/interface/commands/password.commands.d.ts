declare namespace Commands {
    namespace Password {
        interface Contract {
            requestOTP: (props: RequestOTP) => Promise<MessageResult>;
            change: (props: Change) => Promise<MessageResult>;
            resetByOTP: (props: ResetByOTP) => Promise<MessageResult>;
            resetByRecoveryCode: (props: ResetByRecoveryCode) => Promise<MessageResult>;
        }

        type Change = {
            context: RequestContext;
            actor: string;
            input: {
                password: string;
            };
        };

        type RequestOTP = {
            input: {
                identifier: string;
            };
        };

        type ResetByOTP = {
            context: RequestContext;
            input: {
                password: string;
                code: string;
            };
        };

        type ResetByRecoveryCode = {
            context: RequestContext;
            input: {
                identifier: string;
                password: string;
                code: string;
            };
        };
    }
}
