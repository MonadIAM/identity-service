import { OAuthResponseType, CodeChallengeMethod, TokenGrantType } from "~context/enums";

declare global {
    namespace Commands {
        namespace OAuth {
            interface CommandsContract {
                assertAuthorizationPending(props: AssertAuthorizationPending.Props): AssertAuthorizationPending.Result;
                completeAuthorization(props: CompleteAuthorization.Props): CompleteAuthorization.Result;
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
                        grantType: TokenGrantType.REFRESH_TOKEN;
                        refreshToken?: string;
                        client: string;
                    };
                };

                type Result = Promise<
                    MessageResult &
                        Services.Session.Create.Tokens & {
                            tokenType: "Bearer";
                            expiresIn: number;
                        }
                >;
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

                type Result = Promise<void>;
            }
        }
    }
}
