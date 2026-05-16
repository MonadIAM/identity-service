declare namespace Handlers {
    namespace Auth {
        interface Contract {
            verifySecondFactor: (props: VerifySecondFactor.Props) => Promise<VerifySecondFactor.Result>;
            verifyOTP: (props: VerifyOTP.Props) => Promise<VerifyOTP.Result>;
            requestOTP: (props: RequestOTP) => Promise<MessageResult>;
            signin: (props: Signin.Props) => Promise<Signin.Result>;
        }

        namespace Signin {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                };
            };

            type Result = MessageResult & (Services.Session.Create.Result | { pendingToken: string; requires2FA: true });
        }

        type RequestOTP = {
            input: {
                identifier: string;
            };
        };

        namespace VerifyOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    code: string;
                };
            };

            type Result = MessageResult & Services.Session.Create.Result;
        }

        namespace VerifySecondFactor {
            type Props = {
                context: Extract.Meta;
                token?: string;
                input: {
                    code: string;
                };
            };

            type Result = MessageResult & Services.Session.Create.Result;
        }

        type CreateSession = {
            account: Entities.Account;
            context: Extract.Meta;
        };
    }
}
