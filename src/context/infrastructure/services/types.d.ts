import { CodeChallengeMethod } from "~context/enums";
import { LuaScript } from "~context/infrastructure/scripts";

declare global {
    namespace InfrastructureServices {
        namespace ScriptLoader {
            interface Contract {
                reload(script: LuaScript): Promise<string>;
                getHash(script: LuaScript): string;
            }
        }

        namespace ScriptExecutor {
            interface Contract {
                execute<T>(script: LuaScript, args: string[], keys?: string[]): Promise<T>;
            }
        }

        namespace AuthorizationCache {
            interface PrivateContract {
                issueAttempt(props: IssueAttempt.Props): IssueAttempt.Result;
            }

            interface PublicContract {
                consume(props: Consume.Props): Consume.Result;
                create(props: Create.Props): Create.Result;
                issue(props: Issue.Props): Issue.Result;
                get(props: Get.Props): Get.Result;
            }

            interface Contract extends PublicContract, PrivateContract {}

            type RequestMetadata = {
                codeChallengeMethod: CodeChallengeMethod.S256;
                codeChallenge: string;
                redirectUri: string;
                client: string;
                state: string;
            };

            type CodeMetadata = Omit<RequestMetadata, "state"> & {
                account: string;
                acr: string;
            };

            namespace IssueAttempt {
                type Props = Issue.Props & {
                    attemptsRemaining: number;
                };

                type Result = Issue.Result;
            }

            namespace Create {
                type Props = RequestMetadata;

                type Result = Promise<{
                    id: string;
                }>;
            }

            namespace Get {
                type Props = {
                    id: string;
                };

                type Result = Promise<Nullable<RequestMetadata>>;
            }

            namespace Issue {
                type Props = {
                    authorizationRequest: string;
                    account: string;
                    acr: string;
                };

                type Result = Promise<
                    Nullable<{
                        request: RequestMetadata;
                        code: string;
                    }>
                >;
            }

            namespace Consume {
                type Props = {
                    code: string;
                };

                type Result = Promise<Nullable<CodeMetadata>>;
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
                get(props: Get): Promise<Nullable<Metadata>>;
                delete(props: Delete): Promise<void>;
            }

            type Metadata = {
                authorizationRequest: string;
                account: string;
            };

            type Set = {
                metadata: Metadata;
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
}
