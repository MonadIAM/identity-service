declare namespace Commands {
    namespace Authn {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            notificationPayloadMapper: NotificationPayloadMapper.Signature;
            assertCanAuthenticate: AssertCanAuthenticate.Signature;
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
                otp: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
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
                token?: string;
                input: {
                    code: string;
                    id: string;
                };
            };

            type Result = Promise<MessageResult & Awaited<Commands.OAuth.CompleteAuthorization.Result>>;

            type Signature = (props: Props) => Result;
        }

        namespace RequestOTP {
            type Props = {
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
