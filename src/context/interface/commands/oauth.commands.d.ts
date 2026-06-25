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
                authorize(props: Authorize.Props): Authorize.Result;
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
                        codeVerifier?: string;
                        redirectUri?: string;
                        code?: string;
                        client: string;
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
                        codeVerifier: string;
                        redirectUri: string;
                        client: string;
                        code: string;
                    };
                };

                type Result = Commands.Session.Create.Result;
            }

            namespace Refresh {
                type Props = Token.Props;
                type Result = Commands.Session.Refresh.Result;
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
                };

                type Result = Promise<{
                    authorizationUrl: string;
                }>;
            }
        }
    }
}
