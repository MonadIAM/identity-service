declare namespace Commands {
    namespace Session {
        interface ControllerContract {
            revokeAll(props: RevokeAll.Props): RevokeAll.Result;
            revoke(props: Revoke.Props): Revoke.Result;
        }

        interface PrivateContract {
            outboxPayloadMapper(props: OutboxPayloadMapper.Props): OutboxPayloadMapper.Result;
        }

        interface CommandsContract {
            refresh(props: Refresh.Props): Refresh.Result;
        }

        interface Contract extends PrivateContract, CommandsContract, ControllerContract {}

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
                context: Extract.Meta;
                actor: string;
                input: {
                    sessions: string[];
                };
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

        namespace OutboxPayloadMapper {
            type Props = Entities.Session[];

            type Result = Services.Session.Create.RevokedSession[];
        }
    }
}
