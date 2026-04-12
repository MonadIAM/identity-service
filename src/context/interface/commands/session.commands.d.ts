declare namespace Commands {
    namespace Session {
        interface Contract {
            refresh: (props: Refresh.Props) => Promise<Refresh.Result>;
            revokeAll: (props: RevokeAll) => Promise<MessageResult>;
            revoke: (props: Revoke) => Promise<MessageResult>;
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

        type Revoke = {
            context: Extract.Meta;
            actor: string;
            input: {
                sessions: string[];
            };
        };

        type RevokeAll = {
            context: Extract.Meta;
            actor: string;
        };
    }
}
