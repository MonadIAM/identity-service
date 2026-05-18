import { Options as ArgonOptions } from "argon2";
import { JWTPayload, JWK } from "jose";

declare global {
    namespace CommonServices {
        namespace Hashing {
            type Options = ArgonOptions & { raw?: false };

            interface Contract {
                verifyAndUpgrade: (props: VerifyAndUpgrade.Props) => Promise<VerifyAndUpgrade.Result>;
                verify: (props: Verify) => Promise<boolean>;
                hash: (props: Hash) => Promise<string>;
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
                generateRecoveryCodes: (count?: number) => string[];
                generateToken: (bytes?: number) => string;
                generateOTP: (length?: number) => string;
                hashToken: (token: string) => string;
                generateRecoveryCode: () => string;
            }
        }

        namespace JWT {
            interface Contract {
                verifyIgnoringExpiry: (token: string) => Promise<JWTPayload>;
                signRefreshToken: (payload: JWTPayload) => Promise<string>;
                signAccessToken: (payload: JWTPayload) => Promise<string>;
                verify: (token: string) => Promise<JWTPayload>;
                getJWKS: () => Promise<GetJWKS>;
            }

            type GetJWKS = {
                keys: JWK[];
            };

            type SigningKey = {
                privateKey: CryptoKey;
                publicKey: CryptoKey;
                kid: string;
            };
        }

        namespace Email {
            interface Contract {
                send: (props: Send) => Promise<void>;
            }

            type Send = {
                subject: string;
                html: string;
                to: string;
            };
        }

        namespace SMS {
            interface Contract {
                send: (props: Send) => Promise<void>;
            }

            type Send = {
                body: string;
                to: string;
            };
        }

        namespace GoogleOAuth {
            interface Contract {
                fetchProfile: (accessToken: string) => Promise<Profile>;
                exchangeCode: (code: string) => Promise<TokenResponse>;
                getAuthorizationUrl: (state: string) => string;
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
                fetchProfile: (accessToken: string) => Promise<Profile>;
                exchangeCode: (code: string) => Promise<TokenResponse>;
                getAuthorizationUrl: (state: string) => string;
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
