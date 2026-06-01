declare namespace InfrastructureServices {
    namespace AccessCache {
        interface PrivateContract {
            resolveVersionedKey: (props: ResolveVersionedKey.Props) => ResolveVersionedKey.Result;
        }

        interface Contract extends PrivateContract {
            deleteAccount: (props: DeleteAccount.Props) => DeleteAccount.Result;
            deleteRealm: (props: DeleteRealm.Props) => DeleteRealm.Result;
            exists: (props: Exists.Props) => Exists.Result;
            delete: (props: Delete.Props) => Delete.Result;
            deleteAll: () => DeleteAll.Result;
        }

        namespace DeleteAccount {
            type Props = {
                account: string;
            };

            type Result = Promise<void>;
        }

        namespace DeleteRealm {
            type Props = {
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace Exists {
            type Props = {
                permissions: string[];
                account: string;
                realm: string;
            };

            type Result = Promise<boolean>;
        }

        namespace Delete {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace DeleteAll {
            type Result = Promise<void>;
        }

        namespace ResolveVersionedKey {
            type Props = {
                account: string;
                realm: string;
            };

            type Result = Promise<string>;
        }
    }

    namespace OAuthStateCache {
        interface Contract {
            consume: (props: Consume.Props) => Consume.Result;
            set: (props: Set.Props) => Set.Result;
        }

        type Metadata = {
            redirectUri?: string;
            provider: string;
        };

        namespace Set {
            type Props = {
                metadata: Metadata;
                state: string;
            };

            type Result = Promise<void>;
        }

        namespace Consume {
            type Props = {
                state: string;
            };

            type Result = Promise<Nullable<Metadata>>;
        }
    }

    namespace OTPCache {
        interface Contract {
            consume: (props: Consume.Props) => Consume.Result;
            set: (props: Set.Props) => Set.Result;
        }

        type Purpose = "verification" | "identifier" | "login" | "reset" | "setup2FA";

        namespace Consume {
            type Props = {
                purpose: Purpose;
                key: string;
            };

            type Result = Promise<Nullable<string>>;
        }

        namespace Set {
            type Props = {
                purpose: Purpose;
                key: string;
                value: string;
            };

            type Result = Promise<void>;
        }
    }

    namespace PendingAuthCache {
        interface Contract {
            set: (props: Set) => Promise<void>;
            get: (props: Get) => Promise<Nullable<string>>;
            delete: (props: Delete) => Promise<void>;
        }

        type Set = {
            account: string;
            token: string;
        };

        type Get = {
            token: string;
        };

        type Delete = {
            token: string;
        };
    }

    namespace ElevatedAccessCache {
        interface Contract {
            set: (props: Set) => Promise<void>;
            exists: (props: Exists) => Promise<boolean>;
            delete: (props: Delete) => Promise<void>;
        }

        type Set = {
            session: string;
            ttl: number;
        };

        type Exists = {
            session: string;
        };

        type Delete = {
            session: string;
        };
    }

    namespace BlacklistCache {
        interface Contract {
            exists: (props: Exists) => Promise<boolean>;
            set: (props: Set) => Promise<void>;
        }

        type Set = {
            session: string;
            ttl: number;
        };

        type Exists = {
            session: string;
        };
    }
}
