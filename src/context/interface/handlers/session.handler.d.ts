declare namespace Handlers {
    namespace Session {
        interface Contract {
            refresh: (props: Refresh.Props) => Promise<Refresh.Result>;
            logoutAll: (props: LogoutAll) => Promise<MessageResult>;
            logout: (props: Logout) => Promise<MessageResult>;
            forceLogout: (props: ForceLogout) => Promise<MessageResult>;
        }

        namespace Refresh {
            type Props = {
                context: RequestContext;
                actor: string;
                input: {
                    refreshToken: string;
                    session: string;
                };
            };

            type Result = {
                refreshToken: string;
                accessToken: string;
                session: string;
            };
        }

        type Logout = {
            context: RequestContext;
            actor: string;
            input: {
                session: string;
            };
        };

        type LogoutAll = {
            context: RequestContext;
            input: {
                account: string;
                session: string;
            };
        };

        type Revoke = {
            context: RequestContext;
            actor: string;
            input: {
                account: string;
                session: string;
            };
        };

        type ForceLogout = {
            context: RequestContext;
            input: {
                account: string;
                reason: string;
            };
            actor: string;
        };
    }
}
