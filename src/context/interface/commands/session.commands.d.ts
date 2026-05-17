declare namespace Commands {
    namespace Session {
        interface ControllerContract {
            revokeAll: (props: RevokeAll.Props) => RevokeAll.Result;
            refresh: (props: Refresh.Props) => Refresh.Result;
            revoke: (props: Revoke.Props) => Revoke.Result;
        }

        interface Contract extends ControllerContract {}

        namespace Refresh {
            type Props = {
                context: Extract.Meta;
                input: {
                    refreshToken?: string;
                    session?: string;
                };
            };

            type Result = Promise<MessageResult & Awaited<Services.Session.Create.Result>>;
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
    }
}
