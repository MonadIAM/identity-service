declare namespace InfrastructureServices {
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
            account: string;
        };

        type Exists = {
            account: string;
        };

        type Delete = {
            account: string;
        };
    }

    namespace BlacklistCache {
        interface Contract {
            exists: (props: Exists) => Promise<boolean>;
            set: (props: Set) => Promise<void>;
        }

        type Set = {
            sessionId: string;
            ttl: number;
        };

        type Exists = {
            sessionId: string;
        };
    }
}
