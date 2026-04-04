declare namespace Commands {
    namespace Session {
        interface Contract {
            refresh: (props: Refresh.Props) => Promise<Refresh.Result>;
            purge: (props: Purge) => Promise<MessageResult>;
            purgeAll: (props: PurgeAll) => Promise<MessageResult>;
        }

        namespace Refresh {
            type Props = {
                context: RequestContext;
                input: {
                    refreshToken?: string;
                    session: string;
                };
            };

            type Result = MessageResult & Services.Session.Create.Result;
        }

        type Purge = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
                sessions: string[];
            };
        };

        type PurgeAll = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
            };
        };
    }
}
