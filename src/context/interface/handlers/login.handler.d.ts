import { Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Handlers {
        namespace Auth {
            interface Contract {
                byPassword: (props: ByPassword.Props) => Promise<ByPassword.Result>;
                requestOTP: (props: RequestOTP) => Promise<MessageResult>;
                confirmOTP: (props: ConfirmOTP.Props) => Promise<ConfirmOTP.Result>;
                verify2FA: (props: Verify2FA.Props) => Promise<Verify2FA.Result>;
            }

            namespace ByPassword {
                type Props = {
                    context: RequestContext;
                    input: {
                        identifier: string;
                        password: string;
                    };
                };

                type Result = MessageResult &
                    (Services.Session.Create.Result | { pendingToken: string; requires2FA: true });
            }

            type RequestOTP = {
                input: {
                    identifier: string;
                };
            };

            namespace ConfirmOTP {
                type Props = {
                    context: RequestContext;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult & Services.Session.Create.Result;
            }

            namespace Verify2FA {
                type Props = {
                    context: RequestContext;
                    input: {
                        pendingToken: string;
                        code: string;
                    };
                };

                type Result = MessageResult & Services.Session.Create.Result;
            }

            type CreateSession = {
                account: AccountEntity;
                context: RequestContext;
            };
        }
    }
}
