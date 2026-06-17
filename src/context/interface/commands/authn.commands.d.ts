import { TokenGrantType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Authn {
            interface PrivateContract {
                assertCanAuthenticate(props: AssertCanAuthenticate.Props): AssertCanAuthenticate.Result;
                createSession(props: CreateSession.Props): CreateSession.Result;
                password(props: Password.Props): Password.Result;
                refresh(props: Refresh.Props): Refresh.Result;
            }

            interface ControllerContract {
                verifySecondFactor(props: VerifySecondFactor.Props): VerifySecondFactor.Result;
                requestOTP(props: RequestOTP.Props): RequestOTP.Result;
                verifyOTP(props: VerifyOTP.Props): VerifyOTP.Result;
                token(props: Token.Props): Token.Result;
            }

            interface Contract extends PrivateContract, ControllerContract {}

            namespace Token {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        grantType: TokenGrantType;
                        refreshToken?: string;
                        identifier?: string;
                        password?: string;
                        client: string;
                    };
                };

                type Result = Promise<
                    MessageResult &
                        (
                            | (Services.Session.Create.Tokens & {
                                  tokenType: "Bearer";
                                  expiresIn: number;
                              })
                            | { pendingToken: string; requires2FA: true }
                        )
                >;
            }

            namespace Password {
                type Props = Token.Props;
                type Result = Promise<
                    MessageResult & (Services.Session.Create.Tokens | { pendingToken: string; requires2FA: true })
                >;
            }

            namespace Refresh {
                type Props = Token.Props;
                type Result = Commands.Session.Refresh.Result;
            }

            namespace RequestOTP {
                type Props = {
                    input: {
                        identifier: string;
                    };
                };

                type Result = Promise<MessageResult>;
            }

            namespace VerifyOTP {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        code: string;
                    };
                };

                type Result = Promise<MessageResult & Services.Session.Create.Tokens>;
            }

            namespace VerifySecondFactor {
                type Props = {
                    context: Extract.Meta;
                    token?: string;
                    input: {
                        code: string;
                        id: string;
                    };
                };

                type Result = Promise<MessageResult & Services.Session.Create.Tokens>;
            }

            namespace CreateSession {
                type Props = {
                    account: Entities.Account;
                    context: Extract.Meta;
                };

                type Result = Promise<Services.Session.Create.Tokens>;
            }

            namespace AssertCanAuthenticate {
                type Props = Entities.Account;
                type Result = void;
            }
        }
    }
}
