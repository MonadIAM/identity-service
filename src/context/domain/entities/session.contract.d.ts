declare namespace Entities {
    type Session = Session.Contract;

    namespace Session {
        interface Contract {
            id: string;
            createdAt: Date;
            expiresAt: Date;
            lastRefreshedAt: Date;

            refreshTokenHash?: string;
            userAgent: string;
            realms: string[];
            client: string;
            scope: string;
            ip: string;
            acr: string;

            account: Entities.Account;

            refresh(hash: string): void;
            isExpired(): void;
        }

        type ConstructorProps = {
            account: Entities.Account;
            userAgent: string;
            realms: string[];
            expiresAt: Date;
            client: string;
            scope: string;
            acr: string;
            ip: string;
        };
    }
}
