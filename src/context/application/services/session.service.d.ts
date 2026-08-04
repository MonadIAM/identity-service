declare namespace Services {
    namespace Session {
        interface Contract extends CommandContract {}

        interface CommandContract {
            create: Create.Signature;
            purge: Purge.Signature;
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
                    account: Entities.Account;
                    userAgent: string;
                    realms: string[];
                    client: string;
                    scope: string;
                    acr: string;
                    ip: string;
                    nonce?: string;
                };
            };

            type Result = Promise<Tokens & { revokedSessions: RevokedSession[] }>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    sessions: Entities.Session[];
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
