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
        namespace Hashing {
            type Options = HashOptions;

            interface Contract {
                verifyAndUpgrade(props: VerifyAndUpgrade.Props): Promise<VerifyAndUpgrade.Result>;
                verify(props: Verify): Promise<boolean>;
                hash(props: Hash): Promise<string>;
            }

            type Hash = {
                value: string;
            };

            type Verify = {
                storedHash: string;
                value: string;
            };

            namespace VerifyAndUpgrade {
                type Props = {
                    storedHash: string;
                    value: string;
                };

                type Result = {
                    upgradedHash?: string;
                    isValid: boolean;
                };
            }
        }

        namespace Crypto {
            interface Contract {
                generateRecoveryCodes(count?: number): string[];
                generateToken(bytes?: number): string;
                generateOTP(length?: number): string;
                hashToken(token: string): string;
                verifyCodeChallenge(verifier: string, challenge: string): boolean;
                generateRecoveryCode(): string;
            }
        }

        namespace VaultTransit {
            interface Contract {
                getLatestVersion(props: GetLatestVersion.Props): GetLatestVersion.Result;
                getKey(props: GetKey.Props): GetKey.Result;
                decrypt(props: Decrypt.Props): Decrypt.Result;
                encrypt(props: Encrypt.Props): Encrypt.Result;
                rewrap(props: Rewrap.Props): Rewrap.Result;
                sign(props: Sign.Props): Sign.Result;
                hmac(props: Hmac.Props): Hmac.Result;
            }

            namespace GetLatestVersion {
                type Props = {
                    name: string;
                };

                type Result = Promise<number>;
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
            }

            namespace Hmac {
                type Props = {
                    input: string;
                    name: string;
                };

                type Result = Promise<string>;
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
            }

            namespace Decrypt {
                type Props = {
                    ciphertext: string;
                    name: string;
                };

                type Result = Promise<string>;
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
            }

            type KeyVersion = {
                publicKey: string;
                createdAt: string;
                version: number;
            };
        }

        namespace JWT {
            type Token = "REFRESH" | "ACCESS" | "ID";

            interface InternalContract {
                resolveVerificationFailure(error: unknown, tokenType: "ACCESS" | "REFRESH" | "ID"): Failure;
                sign(payload: JWTPayload, props: Sign.Props): Promise<string>;
                computeAtHash(accessToken: string): string;
            }

            interface Contract extends InternalContract {
                signRefreshToken(payload: JWTPayload): Promise<string>;
                signAccessToken(payload: JWTPayload): Promise<string>;
                signIdToken(payload: JWTPayload, props: SignIdToken.Props): Promise<string>;
                verifyRefresh(token: string): Promise<JWTPayload>;
                verifyAccess(token: string): Promise<JWTPayload>;
                verifyIdToken(token: string): Promise<JWTPayload>;
                getJWKS(name?: string): Promise<GetJWKS>;
                computePairwiseSubject(props: ComputePairwiseSubject.Props): Promise<string>;
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
