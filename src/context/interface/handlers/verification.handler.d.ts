import { VerificationScenario, IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Verification {
            interface Contract {
                verifyAccount: (props: VerifyAccount.Props) => Promise<VerifyAccount.Result>;
                verifyIdentifier: (props: VerifyIdentifier) => Promise<MessageResult>;
                resendVerification: (props: Resend) => Promise<MessageResult>;
            }

            namespace VerifyAccount {
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

            type VerifyIdentifier = {
                context: RequestContext;
                input: {
                    code: string;
                };
            };

            type Resend = {
                input: {
                    scenario: VerificationScenario;
                    identifier: string;
                };
            };

            type DispatchOTP = {
                scenario: VerificationScenario;
                type: IdentifierType;
                value: string;
                otp: string;
            };
        }
    }
}
