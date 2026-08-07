declare namespace Commands {
    namespace Mappers {
        namespace Account {
            interface Contract extends PublicContract {}

            interface PublicContract {
                notificationPayload: NotificationPayload.Signature;
                accountPayload: AccountPayload.Signature;
            }

            namespace NotificationPayload {
                type Props = {
                    account: string;
                    otp: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace AccountPayload {
                type Props = {
                    account: Entities.Account;
                };

                type Result = Topics.Account.Message["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
