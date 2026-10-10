declare namespace Services.Session {
    interface Contract extends InternalContract, CommandContract {}

    interface InternalContract {
        resolveAuthenticatable: ResolveAuthenticatable.Signature;
    }

    namespace ResolveAuthenticatable {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                account: string;
            };
        };

        type Result = Promise<Entities.Account>;

        type Signature = (props: Props) => Result;
    }

    interface CommandContract {
        revokeAll: RevokeAll.Signature;
        refresh: Refresh.Signature;
        create: Create.Signature;
        revoke: Revoke.Signature;
    }

    namespace Create {
        type Tokens = {
            refreshToken: string;
            accessToken: string;
            idToken?: string;
        };

        type RevokedSession = {
            expiresAt: number;
            session: string;
        };

        type Props = {
            transaction: ORM.EntityManager;
            input: {
                account: Entities.Account | string;
                userAgent: string;
                realms: string[];
                nonce?: string;
                client: string;
                scope: string;
                acr: string;
                ip: string;
            };
        };

        type Result = Promise<Tokens & { revokedSessions: RevokedSession[] }>;

        type Signature = (props: Props) => Result;
    }

    namespace Refresh {
        type Rotated = {
            refreshToken: string;
            accessToken: string;
            kind: "ROTATED";
        };

        type ReuseDetected = {
            session: Entities.Session;
            kind: "REUSE_DETECTED";
        };

        type Props = {
            transaction: ORM.EntityManager;
            input: {
                tokenHash: string;
                session: string;
                client: string;
            };
        };

        type Result = Promise<Rotated | ReuseDetected>;

        type Signature = (props: Props) => Result;
    }

    namespace Revoke {
        type ByToken = {
            account: string;
            token: string;
        };

        type ByIdentifiers = {
            sessions?: string[];
            account: string;
            current: string;
        };

        type BySessions = {
            sessions: Entities.Session[];
        };

        type Props = {
            transaction: ORM.EntityManager;
            input: ByToken | ByIdentifiers | BySessions;
        };

        type Result = Promise<Entities.Session[]>;

        type Signature = (props: Props) => Result;
    }

    namespace RevokeAll {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                account: string;
            };
        };

        type Result = Promise<Entities.Session[]>;

        type Signature = (props: Props) => Result;
    }
}
