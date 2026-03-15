import { IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Verification {
            type Scenario = "account" | "identifier";

            interface Contract {
                verifyAccount: (props: VerifyAccount.Props) => Promise<VerifyAccount.Result>;
                verifyIdentifier: (props: VerifyIdentifier) => Promise<MessageResult>;
                resendVerification: (props: Resend) => Promise<MessageResult>;
            }

            namespace VerifyAccount {
                type Props = {
                    context: RequestContext;
                    input: {
                        account: string;
                        code: string;
                    };
                };

                type Result = MessageResult & {
                    data: { recoveryCodes: string[] };
                };
            }

            type VerifyIdentifier = {
                context: RequestContext;
                input: {
                    account: string;
                    code: string;
                };
            };

            type Resend = {
                input: {
                    identifier: string;
                    account: string;
                    scenario: Scenario;
                };
            };

            type DispatchOTP = {
                type: IdentifierType;
                scenario: Scenario;
                value: string;
                otp: string;
            };
        }
    }
}
