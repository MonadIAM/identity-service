declare namespace Extract {
    type Meta = {
        userAgent: string;
        ip: string;
    };

    namespace Session {
        type Public = {
            account?: string;
            session?: string;
            realms?: string[];
            scope?: string;
        };
        type Authenticated = {
            realms: string[];
            account: string;
            session: string;
            scope: string;
        };
    }
}
