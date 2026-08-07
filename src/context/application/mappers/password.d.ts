declare namespace Mappers {
    namespace Password {
        interface Contract extends PublicContract {}

        interface PublicContract {
            passwordChangedViaRecoveryCodePayload: PasswordChangedViaRecoveryCodePayload.Signature;
            passwordChangedViaOtpPayload: PasswordChangedViaOtpPayload.Signature;
            passwordChangedPayload: PasswordChangedPayload.Signature;
            notificationPayload: NotificationPayload.Signature;
        }

        namespace PasswordChangedViaRecoveryCodePayload {
            type Props = {
                message: string;
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace PasswordChangedViaOtpPayload {
            type Props = {
                message: string;
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace PasswordChangedPayload {
            type Props = {
                message: string;
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace NotificationPayload {
            type Props = {
                account: string;
                otp: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }
    }
}
