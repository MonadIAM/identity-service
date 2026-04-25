declare namespace InfrastructureServices {
    namespace OAuthStateCache {
        interface Contract {
            set: (props: Set) => Promise<void>;
            get: (props: Get) => Promise<Nullable<Metadata>>;
            delete: (props: Delete) => Promise<void>;
        }

        type Set = {
            metadata: Metadata;
            state: string;
        };

        type Get = {
            state: string;
        };

        type Delete = {
            state: string;
        };

        type Metadata = {
            redirectUri?: string;
            provider: string;
        };
    }

    namespace OTPCache {
        interface Contract {
            setVerification: (props: SetVerification) => Promise<void>;
            getVerification: (props: GetVerification) => Promise<Nullable<string>>;
            deleteVerification: (props: DeleteVerification) => Promise<void>;
            setLogin: (props: SetLogin) => Promise<void>;
            getLogin: (props: GetLogin) => Promise<Nullable<string>>;
            deleteLogin: (props: DeleteLogin) => Promise<void>;
            setReset: (props: SetReset) => Promise<void>;
            getReset: (props: GetReset) => Promise<Nullable<string>>;
            deleteReset: (props: DeleteReset) => Promise<void>;
            setIdentifier: (props: SetIdentifier) => Promise<void>;
            getIdentifier: (props: GetIdentifier) => Promise<Nullable<string>>;
            deleteIdentifier: (props: DeleteIdentifier) => Promise<void>;
            setSetup2FA: (props: SetSetup2FA) => Promise<void>;
            getSetup2FA: (props: GetSetup2FA) => Promise<Nullable<string>>;
            deleteSetup2FA: (props: DeleteSetup2FA) => Promise<void>;
        }

        type SetVerification = {
            account: string;
            code: string;
        };

        type GetVerification = {
            code: string;
        };

        type DeleteVerification = {
            code: string;
        };

        type SetLogin = {
            identifier: string;
            code: string;
        };

        type GetLogin = {
            code: string;
        };

        type DeleteLogin = {
            code: string;
        };

        type SetReset = {
            account: string;
            code: string;
        };

        type GetReset = {
            code: string;
        };

        type DeleteReset = {
            code: string;
        };

        type SetIdentifier = {
            identifier: string;
            code: string;
        };

        type GetIdentifier = {
            code: string;
        };

        type DeleteIdentifier = {
            code: string;
        };

        type SetSetup2FA = {
            account: string;
            secret: string;
        };

        type GetSetup2FA = {
            account: string;
        };

        type DeleteSetup2FA = {
            account: string;
        };
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
