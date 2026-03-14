import { Account } from "~context/domain/entities";

declare global {
    namespace Handlers {
        namespace Login {
            type Session = {
                refreshToken: string;
                accessToken: string;
                session: string;
            };

            interface Contract {
                byPassword: (props: ByPassword.Props) => Promise<ByPassword.Result>;
                requestOTP: (props: RequestOTP) => Promise<MessageResult>;
                confirmOTP: (props: ConfirmOTP) => Promise<Session>;
                verify2FA: (props: Verify2FA) => Promise<Session>;
            }

            namespace ByPassword {
                type Props = {
                    context: RequestContext;
                    input: {
                        identifier: string;
                        password: string;
                    };
                };

                type Result = Promise<
                    | Session
                    | {
                          pendingToken: string;
                          requires2FA: boolean;
                      }
                >;
            }

            type RequestOTP = {
                input: {
                    value: string;
                };
            };

            type ConfirmOTP = {
                context: RequestContext;
                input: {
                    code: string;
                };
            };

            type Verify2FA = {
                context: RequestContext;
                input: {
                    pendingToken: string;
                    totpCode: string;
                };
            };

            type CreateSession = {
                context: RequestContext;
                account: Account;
            };
        }
    }
}
