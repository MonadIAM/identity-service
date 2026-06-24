declare namespace InfrastructureServices {
    namespace AuthorizationRequestCache {
        interface PrivateContract {
            deserialize(props: Deserialize.Props): Deserialize.Result;
        }

        interface PublicContract {
            create(props: Create.Props): Create.Result;
            confirm(props: Confirm.Props): Confirm.Result;
            consume(props: Consume.Props): Consume.Result;
            delete(props: Delete.Props): Delete.Result;
            get(props: Get.Props): Get.Result;
        }

        interface Contract extends PublicContract, PrivateContract {}

        namespace Deserialize {
            type Props = Nullable<string>;
            type Result = Nullable<Metadata>;
        }

        type Metadata = {
            codeChallengeMethod: "S256";
            codeChallenge: string;
            redirectUri: string;
            clientId: string;
            account?: string;
            scope?: string;
            state?: string;
        };

        namespace Create {
            type Props = Metadata;

            type Result = Promise<{
                id: string;
            }>;
        }

        namespace Get {
            type Props = {
                id: string;
            };

            type Result = Promise<Nullable<Metadata>>;
        }

        namespace Confirm {
            type Props = {
                account: string;
                id: string;
            };

            type Result = Promise<void>;
        }

        namespace Consume {
            type Props = {
                id: string;
            };

            type Result = Promise<Nullable<Metadata>>;
        }

        namespace Delete {
            type Props = {
                id: string;
            };

            type Result = Promise<void>;
        }
    }

    namespace AuthorizationClient {
        interface Contract {
            resolve(props: Resolve.Props): Resolve.Result;
            getLoginUrl(): string;
        }

        type Grant = "authorization_code" | "refresh_token";

        type Client = {
            allowedGrants: Grant[];
            redirectUris: string[];
            requirePKCE: true;
            public: true;
            id: string;
        };

        namespace Resolve {
            type Props = {
                redirectUri: string;
                client: string;
            };

            type Result = Client;
        }
    }

    namespace SecondFactorSecret {
        interface Contract {
            resolve(props: Resolve.Props): Resolve.Result;
            encrypt(props: Encrypt.Props): Encrypt.Result;
        }

        namespace Encrypt {
            type Props = {
                secret: string;
            };

            type Result = Promise<string>;
        }

        namespace Resolve {
            type Props = {
                secret: string;
            };

            type Result = Promise<{
                ciphertext?: string;
                plaintext: string;
            }>;
        }
    }

    namespace AccessCache {
        interface PrivateContract {
            resolveVersionedKey(props: ResolveVersionedKey.Props): ResolveVersionedKey.Result;
        }

        interface Contract extends PrivateContract {
            checkPermissions(props: CheckPermissions.Props): CheckPermissions.Result;
            deleteAccount(props: DeleteAccount.Props): DeleteAccount.Result;
            deleteRealm(props: DeleteRealm.Props): DeleteRealm.Result;
            delete(props: Delete.Props): Delete.Result;
            deleteAll(): DeleteAll.Result;
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

        namespace CheckPermissions {
            type Props = {
                permissions: string[];
                globalOnly?: boolean;
                account: string;
                realm: string;
            };

            type Result = Promise<string[]>;
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
            consume(props: Consume.Props): Consume.Result;
            set(props: Set.Props): Set.Result;
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
            consume(props: Consume.Props): Consume.Result;
            set(props: Set.Props): Set.Result;
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

    namespace Pending2FACache {
        interface Contract {
            set(props: Set): Promise<void>;
            get(props: Get): Promise<Nullable<string>>;
            delete(props: Delete): Promise<void>;
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

    namespace ReauthenticationCache {
        interface Contract {
            set(props: Set): Promise<void>;
            exists(props: Exists): Promise<boolean>;
            delete(props: Delete): Promise<void>;
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
            exists(props: Exists): Promise<boolean>;
            set(props: Set): Promise<void>;
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
