declare namespace Extract {
    type Meta = {
        userAgent: string;
        ip: string;
    };

    namespace Session {
        type Public = {
            account?: string;
            session?: string;
        };
        type Authenticated = {
            account: string;
            session: string;
        };
    }
}
