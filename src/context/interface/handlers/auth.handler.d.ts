import { Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Handlers {
        namespace Auth {
            interface Contract {
                confirmSecondFactor: (props: ConfirmSecondFactor.Props) => Promise<ConfirmSecondFactor.Result>;
                confirmOTP: (props: ConfirmOTP.Props) => Promise<ConfirmOTP.Result>;
                requestOTP: (props: RequestOTP) => Promise<MessageResult>;
                signin: (props: Signin.Props) => Promise<Signin.Result>;
            }

            namespace Signin {
                type Props = {
                    context: Extract.Meta;
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
                    context: Extract.Meta;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult & Services.Session.Create.Result;
            }

            namespace ConfirmSecondFactor {
                type Props = {
                    context: Extract.Meta;
                    token?: string;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult & Services.Session.Create.Result;
            }

            type CreateSession = {
                account: AccountEntity;
                context: Extract.Meta;
            };
        }
    }
}
