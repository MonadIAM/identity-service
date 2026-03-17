import { IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Signup {
            interface Contract {
                confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
                byEmail: (props: ByEmail) => Promise<MessageResult>;
                byPhone: (props: ByPhone) => Promise<MessageResult>;
                resend: (props: Resend) => Promise<MessageResult>;
            }

            type ByEmail = {
                context: RequestContext;
                input: {
                    displayName: string;
                    password: string;
                    email: string;
                };
            };

            type ByPhone = {
                context: RequestContext;
                input: {
                    displayName: string;
                    password: string;
                    phone: string;
                };
            };

            type Resend = {
                input: {
                    identifier: string;
                };
            };

            namespace Confirm {
                type Props = {
                    context: RequestContext;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult & {
                    recoveryCodes: string[];
                };
            }

            type SendOTP = {
                type: IdentifierType;
                account: string;
                value: string;
            };
        }
    }
}
