declare namespace Commands {
    namespace Session {
        interface Contract {
            revokeAll: (props: RevokeAll.Props) => Promise<RevokeAll.Result>;
            refresh: (props: Refresh.Props) => Promise<Refresh.Result>;
            revoke: (props: Revoke.Props) => Promise<Revoke.Result>;
        }

        namespace Refresh {
            type Props = {
                context: Extract.Meta;
                input: {
                    refreshToken?: string;
                    session?: string;
                };
            };

            type Result = MessageResult & Services.Session.Create.Result;
        }

        namespace Revoke {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    sessions: string[];
                };
            };

            type Result = MessageResult;
        }

        namespace RevokeAll {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = MessageResult;
        }
    }
}
