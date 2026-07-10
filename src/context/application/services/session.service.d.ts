import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Session {
            interface Contract {
                create(props: Create.Props): Create.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Create {
                type Tokens = {
                    refreshToken: string;
                    accessToken: string;
                };

                type RevokedSession = {
                    expiresAt: number;
                    session: string;
                };

                type Props = {
                    transaction: EntityManager;
                    input: {
                        account: Entities.Account;
                        userAgent: string;
                        realms: string[];
                        client: string;
                        scope: string;
                        acr: string;
                        ip: string;
                    };
                };

                type Result = Promise<Tokens & { revokedSessions: RevokedSession[] }>;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        sessions: Entities.Session[];
                    };
                };

                type Result = void;
            }
        }
    }
}
