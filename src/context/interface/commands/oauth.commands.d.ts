import { FastifyReply } from "fastify";

import { OAuthResponseType, CodeChallengeMethod, TokenGrantType } from "~context/enums";

declare global {
    namespace Commands {
        namespace OAuth {
            interface CommandsContract {
                assertAuthorizationPending(props: AssertAuthorizationPending.Props): AssertAuthorizationPending.Result;
                completeAuthorization(props: CompleteAuthorization.Props): CompleteAuthorization.Result;
                authorizationCode(props: AuthorizationCode.Props): AuthorizationCode.Result;
                refresh(props: Refresh.Props): Refresh.Result;
            }

            interface ControllerContract {
                endSession(props: EndSession.Props): EndSession.Result;
                authorize(props: Authorize.Props): Authorize.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                token(props: Token.Props): Token.Result;
            }

            interface Contract extends CommandsContract, ControllerContract {}

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
            }

            namespace Revoke {
                type Props = {
                    refreshToken?: string;
                    context: Extract.Meta;
                    client: string;
                };

                type Result = Promise<void>;
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
            }

            namespace AssertAuthorizationPending {
                type Props = {
                    authorizationRequest: string;
                };

                type Result = Promise<void>;
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
            }
        }
    }
}
