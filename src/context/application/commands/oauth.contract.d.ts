import { FastifyReply } from "fastify";

import { OAuthResponseType, OAuthTokenTypeHint, CodeChallengeMethod, TokenGrantType } from "~context/enums";

declare global {
    namespace Commands.OAuth {
        interface Contract extends CommandsContract, ControllerContract {}

        interface CommandsContract {
            assertAuthorizationPending: AssertAuthorizationPending.Signature;
            completeAuthorization: CompleteAuthorization.Signature;
            authorizationCode: AuthorizationCode.Signature;
            refresh: Refresh.Signature;
        }

        namespace AssertAuthorizationPending {
            type Props = {
                authorizationRequest: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace CompleteAuthorization {
            type Props = {
                authorizationRequest: string;
                account: string;
                acr: string;
            };

            type Result = Promise<{
                authorizationUrl: string;
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace AuthorizationCode {
            type Props = {
                context: Extract.Meta;
                input: {
                    grantType: TokenGrantType.AUTHORIZATION_CODE;
                    codeVerifier: string;
                    redirectUri: string;
                    client: string;
                    code: string;
                };
            };

            type Result = Commands.Session.Create.Result;

            type Signature = (props: Props) => Result;
        }

        namespace Refresh {
            type Props = {
                context: Extract.Meta;
                input: {
                    grantType: TokenGrantType.REFRESH_TOKEN;
                    refreshToken?: string;
                    client: string;
                };
            };

            type Result = Commands.Session.Refresh.Result;

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            endSession: EndSession.Signature;
            authorize: Authorize.Signature;
            revoke: Revoke.Signature;
            token: Token.Signature;
        }

        namespace EndSession {
            type Props = {
                context: Extract.Meta;
                response: FastifyReply;
                input: {
                    idTokenHint: string;
                    postLogoutRedirectUri?: string;
                    state?: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Authorize {
            type Props = {
                input: {
                    codeChallengeMethod: CodeChallengeMethod;
                    responseType: OAuthResponseType;
                    codeChallenge: string;
                    redirectUri: string;
                    client: string;
                    state: string;
                    scope?: string;
                    nonce?: string;
                };
            };

            type Result = Promise<{
                url: string;
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                tokenTypeHint?: OAuthTokenTypeHint;
                context: Extract.Meta;
                client: string;
                token: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Token {
            type Props = {
                context: Extract.Meta;
                input: {
                    grantType: TokenGrantType;
                    refreshToken?: string;
                    codeVerifier: string;
                    redirectUri: string;
                    client: string;
                    code: string;
                };
            };

            type Result = Promise<
                Services.Session.Create.Tokens & {
                    message?: string;
                    tokenType: "Bearer";
                    expiresIn: number;
                }
            >;

            type Signature = (props: Props) => Result;
        }
    }
}
