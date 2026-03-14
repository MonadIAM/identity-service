import { IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Verification {
            type Scenario = "account" | "identifier";

            interface Contract {
                verifyIdentifier: (props: VerifyIdentifier) => Promise<MessageResult>;
                verifyAccount: (props: VerifyAccount) => Promise<MessageResult>;
                resendVerification: (props: Resend) => Promise<MessageResult>;
            }

            type VerifyAccount = {
                context: RequestContext;
                input: {
                    account: string;
                    code: string;
                };
            };

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
