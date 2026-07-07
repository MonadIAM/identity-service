import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Application {
            interface Contract {
                applyRealmRevocation(props: ApplyRealmRevocation.Props): ApplyRealmRevocation.Result;
                applyRealmRestore(props: ApplyRealmRestore.Props): ApplyRealmRestore.Result;
                purgeRealm(props: PurgeRealm.Props): PurgeRealm.Result;
                restore(props: Restore.Props): Restore.Result;
                create(props: Create.Props): Create.Result;
                update(props: Update.Props): Update.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        description?: string;
                        realm: string;
                        name: string;
                    };
                };

                type Result = Promise<Entities.Application>;
            }

            namespace Update {
                type Props = {
                    entity: Entities.Application;
                    patch: {
                        description?: string;
                        name?: string;
                    };
                };

                type Result = void;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.Application[];
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.Application[];
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.Application[];
                };

                type Result = void;
            }

            namespace ApplyRealmRevocation {
                type Props = {
                    entities: Entities.Application[];
                    version: number;
                };

                type Result = void;
            }

            namespace ApplyRealmRestore {
                type Props = {
                    entities: Entities.Application[];
                    version: number;
                };

                type Result = void;
            }

            namespace PurgeRealm {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.Application[];
                    version: number;
                };

                type Result = void;
            }
        }
    }
}
