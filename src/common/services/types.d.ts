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

        type Hmac = {
            hmac: string;
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

            interface Contract {
                getLatestVersion: GetLatestVersion.Signature;
                decrypt: Decrypt.Signature;
                encrypt: Encrypt.Signature;
                getKey: GetKey.Signature;
                rewrap: Rewrap.Signature;
                sign: Sign.Signature;
                hmac: Hmac.Signature;
            }

            namespace GetLatestVersion {
                type Props = {
                    name: string;
                };

                type Result = Promise<number>;

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

            namespace Decrypt {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<string>;

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
        }

        namespace Hashing {
            type Options = HashOptions;

            interface Contract {
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
            interface Contract {
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
            type Token = "REFRESH" | "ACCESS" | "ID";

            interface InternalContract {
                resolveVerificationFailure(error: unknown, tokenType: "ACCESS" | "REFRESH" | "ID"): Failure;
                sign(payload: JWTPayload, props: Sign.Props): Promise<string>;
                computeAtHash(accessToken: string): string;
            }

            interface Contract extends InternalContract {
                computePairwiseSubject(props: ComputePairwiseSubject.Props): Promise<string>;
                signIdToken(payload: JWTPayload, props: SignIdToken.Props): Promise<string>;
                signRefreshToken(payload: JWTPayload): Promise<string>;
                signAccessToken(payload: JWTPayload): Promise<string>;
                verifyRefresh(token: string): Promise<JWTPayload>;
                verifyIdToken(token: string): Promise<JWTPayload>;
                verifyAccess(token: string): Promise<JWTPayload>;
                getJWKS(name?: string): Promise<GetJWKS>;
            }

            type Failure = {
                params?: UnknownObject;
                description: string;
                messageKey: string;
            };

            type GetJWKS = {
                keys: JWK[];
            };

            namespace Sign {
                type Props = {
                    audience: string;
                    type: string;
                    key: string;
                    ttl: number;
                };
            }

            namespace SignIdToken {
                type Props = {
                    accessToken: string;
                    audience: string;
                };
            }

            namespace ComputePairwiseSubject {
                type Props = {
                    client: string;
                    account: string;
                };
            }
        }

        namespace GoogleOAuth {
            interface Contract {
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
            interface Contract {
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
