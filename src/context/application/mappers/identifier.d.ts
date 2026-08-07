declare namespace Commands {
    namespace Mappers {
        namespace Identifier {
            interface Contract extends PublicContract {}

            interface PublicContract {
                identifierPurgedPayload: IdentifierPurgedPayload.Signature;
                notificationPayload: NotificationPayload.Signature;
            }

            namespace IdentifierPurgedPayload {
                type Props = {
                    account: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationPayload {
                type Props = {
                    identifier: string;
                    account: string;
                    otp: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
