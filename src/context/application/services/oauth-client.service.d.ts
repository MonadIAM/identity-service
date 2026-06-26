import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace OAuthClient {
            interface Contract {
                restore(props: Restore.Props): Restore.Result;
                create(props: Create.Props): Create.Result;
                update(props: Update.Props): Update.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Create {
                type Input = Pick<Entities.OAuthClient.ConstructorProps, "description" | "redirectUri" | "realm" | "name">;

                type Props = {
                    transaction: EntityManager;
                    input: Input;
                };

                type Result = Promise<Entities.OAuthClient>;
            }

            namespace Update {
                type Props = {
                    entity: Entities.OAuthClient;
                    patch: Entities.OAuthClient.ChangeDataProps;
                };

                type Result = void;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.OAuthClient[];
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.OAuthClient[];
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.OAuthClient[];
                };

                type Result = void;
            }
        }
    }
}
