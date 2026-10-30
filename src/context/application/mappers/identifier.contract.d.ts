declare namespace Commands.Mappers.Identifier {
    interface Contract extends PublicContract {}

    interface PublicContract {
        identifierPurgedPayload: IdentifierPurgedPayload.Signature;
        notificationPayload: NotificationPayload.Signature;
        emailPayload: EmailPayload.Signature;
        emailPurgedPayload: EmailPurgedPayload.Signature;
    }

    namespace EmailPayload {
        type Props = { identifier: Entities.Identifier };

        type Result = Topics.Account.EmailVerifiedMessage["payload"][];

        type Signature = (props: Props) => Result;
    }

    namespace EmailPurgedPayload {
        type Props = Awaited<Services.Identifier.Purge.Result>;

        type Result = Topics.Account.EmailPurgedMessage["payload"][];

        type Signature = (props: Props) => Result;
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
            identifier: Pick<Entities.Identifier, "id" | "identity" | "type">;
            account: string;
            otp: string;
        };

        type Result = Topics.Notification.CreateMessage["payload"];

        type Signature = (props: Props) => Result;
    }
}
