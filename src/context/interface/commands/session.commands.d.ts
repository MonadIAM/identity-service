declare namespace Commands {
    namespace Session {
        interface ControllerContract {
            revokeAll(props: RevokeAll.Props): RevokeAll.Result;
            revoke(props: Revoke.Props): Revoke.Result;
        }

        interface PrivateContract {
            blacklistPayloadMapper(props: BlacklistPayloadMapper.Props): BlacklistPayloadMapper.Result;
        }

        interface CommandsContract {
            refresh(props: Refresh.Props): Refresh.Result;
            create(props: Create.Props): Create.Result;
            revoke(props: Revoke.Props): Revoke.Result;
        }

        interface Contract extends PrivateContract, CommandsContract, ControllerContract {}

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
        }

        namespace Revoke {
            type Props = {
                input: { refreshToken: string } | { sessions?: string[] };
                context: Extract.Meta;
                session: string;
                actor: string;
            };

            type Result = Promise<MessageResult>;
        }

        namespace RevokeAll {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<MessageResult>;
        }

        namespace BlacklistPayloadMapper {
            type Props =
                | {
                      revokedSessions: Services.Session.Create.RevokedSession[];
                  }
                | Entities.Session[];

            type Result = Services.Session.Create.RevokedSession[];
        }
    }
}
