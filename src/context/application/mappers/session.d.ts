declare namespace Mappers {
    namespace Session {
        type CreateResult = Awaited<Services.Session.Create.Tokens> & {
            revokedSessions: Services.Session.Create.RevokedSession[];
            account: string;
        };

        interface Contract extends PublicContract {}

        interface PublicContract {
            notificationPayload: NotificationPayload.Signature;
            blacklistPayload: BlacklistPayload.Signature;
        }

        namespace NotificationPayload {
            type Props = CreateResult;

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace BlacklistPayload {
            type Props = CreateResult | { sessions: Entities.Session[] };

            type Result = Services.Session.Create.RevokedSession[];

            type Signature = (props: Props) => Result;
        }
    }
}
