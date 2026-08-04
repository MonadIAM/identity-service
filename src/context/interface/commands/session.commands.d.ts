declare namespace Commands {
    namespace Session {
        interface Contract extends InternalContract, PublicContract {}

        interface InternalContract {
            notificationPayloadMapper: NotificationPayloadMapper.Signature;
            blacklistPayloadMapper: BlacklistPayloadMapper.Signature;
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace BlacklistPayloadMapper {
            type Props =
                | {
                      revokedSessions: Services.Session.Create.RevokedSession[];
                  }
                | Entities.Session[];

            type Result = Services.Session.Create.RevokedSession[];

            type Signature = (props: Props) => Result;
        }

        interface PublicContract {
            revokeAll: RevokeAll.Signature;
            refresh: Refresh.Signature;
            create: Create.Signature;
            revoke: Revoke.Signature;
        }

        interface CommandsContract extends Pick<PublicContract, "refresh" | "create" | "revoke"> {}

        interface ControllerContract extends Pick<PublicContract, "revokeAll" | "revoke"> {}

        namespace RevokeAll {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Refresh {
            type Props = {
                context: Extract.Meta;
                input: {
                    client: string;
                    refreshToken?: string;
                };
            };

            type Result = Promise<MessageResult & Services.Session.Create.Tokens>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                input: {
                    realms: string[];
                    account: string;
                    client: string;
                    scope: string;
                    acr: string;
                    nonce?: string;
                };
            };

            type Result = Promise<Services.Session.Create.Tokens>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                input: { refreshToken: string } | { sessions?: string[] };
                context: Extract.Meta;
                session: string;
                actor: string;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
