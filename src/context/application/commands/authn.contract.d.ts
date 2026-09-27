declare namespace Commands {
    namespace Authn {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            assertCanAuthenticate: AssertCanAuthenticate.Signature;
        }

        namespace AssertCanAuthenticate {
            type Props = Entities.Account;

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            verifySecondFactor: VerifySecondFactor.Signature;
            requestOTP: RequestOTP.Signature;
            verifyOTP: VerifyOTP.Signature;
            password: Password.Signature;
        }

        namespace VerifySecondFactor {
            type Props = {
                context: Extract.Meta;
                token?: string;
                input: {
                    code: string;
                };
            };

            type Result = Promise<MessageResult & Awaited<Commands.OAuth.CompleteAuthorization.Result>>;

            type Signature = (props: Props) => Result;
        }

        namespace RequestOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    authorizationRequest: string;
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace VerifyOTP {
            type Props = {
                input: {
                    authorizationRequest: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult & Awaited<Commands.OAuth.CompleteAuthorization.Result>>;

            type Signature = (props: Props) => Result;
        }

        namespace Password {
            type Props = {
                input: {
                    authorizationRequest: string;
                    identifier: string;
                    password: string;
                };
            };

            type Result = Promise<
                MessageResult &
                    (Awaited<Commands.OAuth.CompleteAuthorization.Result> | { pendingToken: string; requires2FA: true })
            >;

            type Signature = (props: Props) => Result;
        }
    }
}
