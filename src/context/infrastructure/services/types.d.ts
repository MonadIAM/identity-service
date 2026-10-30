import type { PermissionCode, PrivilegeScope } from "@monadiam/shared";

import { LuaScript } from "~context/infrastructure/scripts";
import { CodeChallengeMethod, ReauthenticationMethod } from "~context/enums";

declare global {
    namespace InfrastructureServices {
        namespace ReauthenticationCache {
            type Proof = Topics.Reauthentication.Proof;

            interface Contract extends PublicContract {}

            interface PublicContract {
                exists: Exists.Signature;
                delete: Delete.Signature;
                set: Set.Signature;
                get: Get.Signature;
            }

            namespace Exists {
                type Props = {
                    methods?: ReauthenticationMethod[];
                    session: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Delete {
                type Props = {
                    session: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    session: string;
                    proof?: Proof;
                    ttl: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Get {
                type Props = {
                    session: string;
                    method: ReauthenticationMethod;
                };

                type Result = Promise<Nullable<Proof>>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace AuthorizationCache {
            type RequestMetadata = {
                codeChallengeMethod: CodeChallengeMethod.S256;
                codeChallenge: string;
                redirectUri: string;
                client: string;
                state: string;
                scope: string;
                nonce?: string;
            };

            type CodeMetadata = Omit<RequestMetadata, "state"> & {
                account: string;
                acr: string;
            };

            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                issueAttempt: IssueAttempt.Signature;
            }

            namespace IssueAttempt {
                type Props = Issue.Props & {
                    attemptsRemaining: number;
                };

                type Result = Issue.Result;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                consume: Consume.Signature;
                create: Create.Signature;
                issue: Issue.Signature;
                get: Get.Signature;
            }

            namespace Consume {
                type Props = {
                    code: string;
                };

                type Result = Promise<Nullable<CodeMetadata>>;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = RequestMetadata;

                type Result = Promise<{
                    id: string;
                }>;

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }

            namespace Get {
                type Props = {
                    id: string;
                };

                type Result = Promise<Nullable<RequestMetadata>>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace SecondFactorSecret {
            interface Contract extends PublicContract {}

            interface PublicContract {
                resolve: Resolve.Signature;
                encrypt: Encrypt.Signature;
            }

            namespace Encrypt {
                type Props = {
                    secret: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace Resolve {
                type Props = {
                    secret: string;
                };

                type Result = Promise<{
                    ciphertext?: string;
                    plaintext: string;
                }>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Pending2FACache {
            type Metadata = {
                authorizationRequest: string;
                account: string;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                delete: Delete.Signature;
                set: Set.Signature;
                get: Get.Signature;
            }

            namespace Delete {
                type Props = {
                    token: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    metadata: Metadata;
                    token: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Get {
                type Props = {
                    token: string;
                };

                type Result = Promise<Nullable<Metadata>>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace OAuthStateCache {
            type Metadata = {
                authorizationRequest?: string;
                redirectUri?: string;
                timeZone?: string;
                provider: string;
                locale?: string;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                consume: Consume.Signature;
                get: Get.Signature;
                set: Set.Signature;
            }

            namespace Consume {
                type Props = {
                    state: string;
                };

                type Result = Promise<Nullable<Metadata>>;

                type Signature = (props: Props) => Result;
            }

            namespace Get {
                type Props = {
                    state: string;
                };

                type Result = Promise<Nullable<Metadata>>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    metadata: Metadata;
                    state: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace BlacklistCache {
            interface Contract extends PublicContract {}

            interface PublicContract {
                exists: Exists.Signature;
                set: Set.Signature;
            }

            namespace Exists {
                type Props = {
                    session: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    session: string;
                    ttl: number;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace ScriptExecutor {
            interface Contract extends InternalContract, PublicContract {}

            interface InternalContract {
                evalsha: Evalsha.Signature;
            }

            namespace Evalsha {
                type Props = {
                    script: LuaScript;
                    args: string[];
                    keys: string[];
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }

            interface PublicContract {
                execute: Execute.Signature;
            }

            namespace Execute {
                type Props = {
                    script: LuaScript;
                    args: string[];
                    keys?: string[];
                };

                type Result<T> = Promise<T>;

                type Signature = <T>(props: Props) => Result<T>;
            }
        }

        namespace ScriptLoader {
            interface Contract extends PublicContract {}

            interface PublicContract {
                getHash: GetHash.Signature;
                reload: Reload.Signature;
            }

            namespace GetHash {
                type Props = LuaScript;

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace Reload {
                type Props = LuaScript;

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace AccessCache {
            interface Contract extends InternalContract, PublicContract {}

            interface InternalContract {
                resolveVersionedKeys: ResolveVersionedKeys.Signature;
                loadPermissions: LoadPermissions.Signature;
            }

            namespace LoadPermissions {
                type Props = Omit<CheckPermissions.Props, "permissions"> & {
                    keys: Awaited<ResolveVersionedKeys.Result>;
                    globalLoaded: boolean;
                    realmLoaded: boolean;
                };

                type Result = GRPC.AccessControl.Client.Response;

                type Signature = (props: Props) => Result;
            }

            namespace ResolveVersionedKeys {
                type Props = {
                    account: string;
                    realm: string;
                };

                type Result = Promise<{ realm: string; global: string }>;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                checkPermissions: CheckPermissions.Signature;
                deleteAccount: DeleteAccount.Signature;
                deleteRealm: DeleteRealm.Signature;
                deleteAll: DeleteAll.Signature;
                delete: Delete.Signature;
            }

            namespace CheckPermissions {
                type Props = {
                    permissions: PermissionCode[];
                    globalOnly?: boolean;
                    account: string;
                    realm: string;
                };

                type Result = Promise<Partial<Record<PermissionCode, PrivilegeScope>>>;

                type Signature = (props: Props) => Result;
            }

            namespace DeleteAccount {
                type Props = {
                    account: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace DeleteRealm {
                type Props = {
                    realm: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace DeleteAll {
                type Result = Promise<void>;

                type Signature = () => Result;
            }

            namespace Delete {
                type Props = {
                    account: string;
                    realm: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace OTPCache {
            type Purpose = "verification" | "identifier" | "login" | "reset" | "setup2FA" | "reauthentication";

            interface Contract extends PublicContract {}

            interface PublicContract {
                consume: Consume.Signature;
                set: Set.Signature;
            }

            namespace Consume {
                type Props = {
                    purpose: Purpose;
                    key: string;
                };

                type Result = Promise<Nullable<string>>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    purpose: Purpose;
                    key: string;
                    value: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace SessionRefreshIdempotency {
            type Result = {
                refreshToken: string;
                accessToken: string;
                message: Intl.Key;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                get: Get.Signature;
                set: Set.Signature;
            }

            namespace Get {
                type Props = {
                    key: string;
                };

                type Result = Promise<Nullable<SessionRefreshIdempotency.Result>>;

                type Signature = (props: Props) => Result;
            }

            namespace Set {
                type Props = {
                    key: string;
                    result: SessionRefreshIdempotency.Result;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
