declare namespace Commands {
    namespace Authn {
        interface InternalContract {
            notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
            assertCanAuthenticate(props: AssertCanAuthenticate.Props): AssertCanAuthenticate.Result;
        }

        interface ControllerContract {
            verifySecondFactor(props: VerifySecondFactor.Props): VerifySecondFactor.Result;
            requestOTP(props: RequestOTP.Props): RequestOTP.Result;
            verifyOTP(props: VerifyOTP.Props): VerifyOTP.Result;
            password(props: Password.Props): Password.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

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
        }

        namespace RequestOTP {
            type Props = {
                input: {
                    authorizationRequest: string;
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace VerifyOTP {
            type Props = {
                input: {
                    authorizationRequest: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult & Awaited<Commands.OAuth.CompleteAuthorization.Result>>;
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
        }

        namespace AssertCanAuthenticate {
            type Props = Entities.Account;
            type Result = void;
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
                otp: string;
            };

            type Result = Topics.Notification.Message["payload"];
        }
    }
}
