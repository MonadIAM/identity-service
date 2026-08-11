declare namespace Commands {
    namespace Mappers {
        namespace Invite {
            interface Contract extends PublicContract {}

            interface PublicContract {
                notificationCancelPayload: NotificationCancelPayload.Signature;
                joinRequestedPayload: JoinRequestedPayload.Signature;
                notificationPayload: NotificationPayload.Signature;
            }

            namespace JoinRequestedPayload {
                type Props = {
                    invites: Entities.Invite[];
                };

                type Result = Topics.Membership.JoinRequestedMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationCancelPayload {
                type Props = {
                    invites: Entities.Invite[];
                };

                type Result = Topics.Notification.CancelMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationPayload {
                type Props = {
                    invites: Entities.Invite[];
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
