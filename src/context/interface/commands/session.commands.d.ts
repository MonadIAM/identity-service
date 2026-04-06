declare namespace Commands {
    namespace Session {
        interface Contract {
            refresh: (props: Refresh.Props) => Promise<Refresh.Result>;
            purgeAll: (props: PurgeAll) => Promise<MessageResult>;
            purge: (props: Purge) => Promise<MessageResult>;
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

        type Purge = {
            context: Extract.Meta;
            actor: string;
            input: {
                sessions: string[];
            };
        };

        type PurgeAll = {
            context: Extract.Meta;
            actor: string;
        };
    }
}
