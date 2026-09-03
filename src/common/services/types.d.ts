import { JWTPayload, JWK } from "jose";
import { HashOptions } from "argon2";

declare global {
    namespace Vault {
        type KeyCache = {
            data: Awaited<CommonServices.VaultTransit.GetKey.Result>;
            expiresAt: number;
        };

        type Response<T> = {
            data: T;
        };

        type Key = {
            creation_time: string;
            public_key: string;
        };

        type GetKey = {
            keys: Record<string, Key>;
            latest_version: number;
            type: string;
        };

        type Sign = {
            key_version: number;
            signature: string;
        };

        type SignBatch = {
            batch_results: Sign[];
        };

        type Hmac = {
            hmac: string;
        };

        type HmacBatch = {
            batch_results: Hmac[];
        };

        type Encrypt = {
            key_version: number;
            ciphertext: string;
        };

        type Decrypt = {
            plaintext: string;
        };

        type Rewrap = {
            key_version: number;
            ciphertext: string;
        };
    }

    namespace CommonServices {
        namespace VaultTransit {
            type KeyVersion = {
                publicKey: string;
                createdAt: string;
                version: number;
            };

            interface Contract extends PublicContract {}

            interface PublicContract {
                getLatestVersion: GetLatestVersion.Signature;
                decrypt: Decrypt.Signature;
                encrypt: Encrypt.Signature;
                getKey: GetKey.Signature;
                rewrap: Rewrap.Signature;
                sign: Sign.Signature;
                signBatch: SignBatch.Signature;
                hmac: Hmac.Signature;
                hmacBatch: HmacBatch.Signature;
            }

            namespace GetLatestVersion {
                type Props = {
                    name: string;
                };

                type Result = Promise<number>;

                type Signature = (props: Props) => Result;
            }

            namespace Decrypt {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace Encrypt {
                type Props = {
                    plaintext: string;
                    name: string;
                };

                type Result = Promise<{
                    ciphertext: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace GetKey {
                type Props = {
                    name: string;
                };

                type Result = Promise<{
                    versions: KeyVersion[];
                    latestVersion: number;
                    name: string;
                    type: string;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Rewrap {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<{
                    ciphertext: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Sign {
                type Props = {
                    version: number;
                    input: string;
                    name: string;
                };

                type Result = Promise<{
                    signature: string;
                    version: number;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Hmac {
                type Props = {
                    input: string;
                    name: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace SignBatch {
                type Props = {
                    version: number;
                    inputs: string[];
                    name: string;
                };

                type Result = Promise<{ signature: string; version: number }[]>;

                type Signature = (props: Props) => Result;
            }

            namespace HmacBatch {
                type Props = {
                    inputs: string[];
                    name: string;
                };

                type Result = Promise<string[]>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Hashing {
            type Options = HashOptions;

            interface Contract extends PublicContract {}

            interface PublicContract {
                verifyAndUpgrade: VerifyAndUpgrade.Signature;
                verify: Verify.Signature;
                hash: Hash.Signature;
            }

            namespace VerifyAndUpgrade {
                type Props = {
                    storedHash: string;
                    value: string;
                };

                type Result = Promise<{
                    upgradedHash?: string;
                    isValid: boolean;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Verify {
                type Props = {
                    storedHash: string;
                    value: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Hash {
                type Props = {
                    value: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Crypto {
            interface Contract extends PublicContract {}

            interface PublicContract {
                generateRecoveryCodes: GenerateRecoveryCodes.Signature;
                generateRecoveryCode: GenerateRecoveryCode.Signature;
                verifyCodeChallenge: VerifyCodeChallenge.Signature;
                generateToken: GenerateToken.Signature;
                generateOTP: GenerateOTP.Signature;
                hashToken: HashToken.Signature;
            }

            namespace GenerateRecoveryCodes {
                type Props = {
                    count?: number;
                };

                type Result = string[];

                type Signature = (props?: Props) => Result;
            }

            namespace GenerateRecoveryCode {
                type Result = string;

                type Signature = () => Result;
            }

            namespace VerifyCodeChallenge {
                type Props = {
                    challenge: string;
                    verifier: string;
                };

                type Result = boolean;

                type Signature = (props: Props) => Result;
            }

            namespace GenerateToken {
                type Props = {
                    bytes?: number;
                };

                type Result = string;

                type Signature = (props?: Props) => Result;
            }

            namespace GenerateOTP {
                type Props = {
                    length?: number;
                };

                type Result = string;

                type Signature = (props?: Props) => Result;
            }

            namespace HashToken {
                type Props = {
                    token: string;
                };

                type Result = string;

                type Signature = (props: Props) => Result;
            }
        }

        namespace JWT {
            interface Contract extends InternalContract, PublicContract {}

            interface InternalContract {
                resolveVerificationFailure: ResolveVerificationFailure.Signature;
                selectVerifiableVersions: SelectVerifiableVersions.Signature;
                getVerificationJWKS: GetVerificationJWKS.Signature;
                describeKeyVersion: DescribeKeyVersion.Signature;
                pruneJWKCache: PruneJWKCache.Signature;
                sign: Sign.Signature;
            }

            namespace ResolveVerificationFailure {
                type Props = {
                    tokenType: "REFRESH" | "ACCESS" | "ID";
                    error: unknown;
                };

                type Result = {
                    params?: UnknownObject;
                    messageKey: Intl.Key;
                    description: string;
                };

                type Signature = (props: Props) => Result;
            }

            namespace SelectVerifiableVersions {
                type Props = {
                    key: Awaited<CommonServices.VaultTransit.GetKey.Result>;
                };

                type Result = CommonServices.VaultTransit.KeyVersion[];

                type Signature = (props: Props) => Result;
            }

            namespace GetVerificationJWKS {
                type Props = string;

                type Result = Promise<{
                    keys: JWK[];
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace DescribeKeyVersion {
                type Props = {
                    keyVersion: CommonServices.VaultTransit.KeyVersion;
                    name: string;
                };

                type Result = Promise<JWK>;

                type Signature = (props: Props) => Result;
            }

            namespace PruneJWKCache {
                type Props = {
                    versions: CommonServices.VaultTransit.KeyVersion[];
                    name: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Sign {
                type Props = {
                    payload: JWTPayload;
                    props: {
                        audience: string;
                        type: string;
                        key: string;
                        ttl: number;
                    };
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                computePairwiseSubject: ComputePairwiseSubject.Signature;
                signRefreshToken: SignRefreshToken.Signature;
                signAccessToken: SignAccessToken.Signature;
                getPublicJWKS: GetPublicJWKS.Signature;
                verifyRefresh: VerifyToken.Signature;
                verifyIdToken: VerifyToken.Signature;
                verifyAccess: VerifyToken.Signature;
                signIdToken: SignIdToken.Signature;
            }

            namespace ComputePairwiseSubject {
                type Props = {
                    client: string;
                    account: string;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace SignRefreshToken {
                type Props = {
                    payload: JWTPayload;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace SignAccessToken {
                type Props = {
                    payload: JWTPayload;
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace GetPublicJWKS {
                type Result = Promise<{
                    keys: JWK[];
                }>;

                type Signature = () => Result;
            }

            namespace SignIdToken {
                type Props = {
                    payload: JWTPayload;
                    props: {
                        accessToken: string;
                        audience: string;
                    };
                };

                type Result = Promise<string>;

                type Signature = (props: Props) => Result;
            }

            namespace VerifyToken {
                type Props = {
                    token: string;
                };

                type Result = Promise<JWTPayload>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace GoogleOAuth {
            interface Contract extends PublicContract {}

            interface PublicContract {
                fetchProfile(accessToken: string): Promise<Profile>;
                exchangeCode(code: string): Promise<TokenResponse>;
                getAuthorizationUrl(state: string): string;
            }

            type TokenResponse = {
                refresh_token?: string;
                access_token: string;
                token_type: string;
                expires_in: number;
                id_token?: string;
                scope: string;
            };

            type Profile = {
                providerUserId: string;
                displayName: string;
                emailVerified: boolean;
                pictureUrl?: string;
                email?: string;
            };
        }

        namespace GitHubOAuth {
            interface Contract extends PublicContract {}

            interface PublicContract {
                fetchProfile(accessToken: string): Promise<Profile>;
                exchangeCode(code: string): Promise<TokenResponse>;
                getAuthorizationUrl(state: string): string;
            }

            type TokenResponse = {
                access_token: string;
                token_type: string;
                scope: string;
            };

            type UserResponse = {
                avatar_url?: string;
                email?: string;
                name?: string;
                login: string;
                id: number;
            };

            type EmailEntry = {
                visibility?: string;
                verified: boolean;
                primary: boolean;
                email: string;
            };

            type Profile = {
                providerUserId: string;
                displayName: string;
                emailVerified: boolean;
                pictureUrl?: string;
                email?: string;
            };
        }
    }
}
