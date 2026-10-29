declare namespace Commands.Mappers.Reauthentication {
    interface Contract extends PublicContract {}

    interface PublicContract {
        notificationPayload: NotificationPayload.Signature;
        grantPayload: GrantPayload.Signature;
    }

    namespace NotificationPayload {
        type Props = {
            account: string;
            address: string;
            otp: string;
        };

        type Result = Topics.Notification.CreateMessage["payload"];

        type Signature = (props: Props) => Result;
    }

    namespace GrantPayload {
        type Props = {
            expiresAt: number;
            session: string;
        };

        type Result = {
            expiresAt: number;
            session: string;
        };

        type Signature = (props: Props) => Result;
    }
}
