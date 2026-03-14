import { IdentifierType } from "~context/enums";

declare global {
    namespace InfrastructureServices {
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
                getIdentifier: (props: GetIdentifier) => Promise<Nullable<IdentifierData>>;
                deleteIdentifier: (props: DeleteIdentifier) => Promise<void>;
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

            type IdentifierData = {
                account: string;
                type: IdentifierType;
                value: string;
            };

            type SetIdentifier = {
                data: IdentifierData;
                code: string;
            };

            type GetIdentifier = {
                code: string;
            };

            type DeleteIdentifier = {
                code: string;
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
    }
}
