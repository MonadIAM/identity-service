declare namespace Commands {
    namespace Authn {
        interface PrivateContract {
            assertCanAuthenticate: (props: AssertCanAuthenticate.Props) => AssertCanAuthenticate.Result;
            createSession: (props: CreateSession.Props) => CreateSession.Result;
        }

        interface ControllerContract {
            verifySecondFactor: (props: VerifySecondFactor.Props) => VerifySecondFactor.Result;
            requestOTP: (props: RequestOTP.Props) => RequestOTP.Result;
            verifyOTP: (props: VerifyOTP.Props) => VerifyOTP.Result;
            signin: (props: Signin.Props) => Signin.Result;
        }

        interface Contract extends PrivateContract, ControllerContract {}

        namespace Signin {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                };
            };

            type Result = Promise<
                MessageResult & (Services.Session.Create.Tokens | { pendingToken: string; requires2FA: true })
            >;
        }

        namespace RequestOTP {
            type Props = {
                input: {
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace VerifyOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    code: string;
                };
            };

            type Result = Promise<MessageResult & Services.Session.Create.Tokens>;
        }

        namespace VerifySecondFactor {
            type Props = {
                context: Extract.Meta;
                token?: string;
                input: {
                    code: string;
                    id: string;
                };
            };

            type Result = Promise<MessageResult & Services.Session.Create.Tokens>;
        }

        namespace CreateSession {
            type Props = {
                account: Entities.Account;
                context: Extract.Meta;
            };

            type Result = Promise<Services.Session.Create.Tokens>;
        }

        namespace AssertCanAuthenticate {
            type Props = Entities.Account;
            type Result = void;
        }
    }
}
