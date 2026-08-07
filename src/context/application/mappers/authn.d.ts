declare namespace Mappers {
    namespace Authn {
        interface Contract extends PublicContract {}

        interface PublicContract {
            notificationPayload: NotificationPayload.Signature;
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
