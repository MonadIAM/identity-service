declare namespace Commands {
    namespace Password {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            findMatchingRecoveryCode: FindMatchingRecoveryCode.Signature;
            checkPasswordHistory: CheckPasswordHistory.Signature;
        }

        namespace FindMatchingRecoveryCode {
            type Props = {
                codes: Entities.RecoveryCode[];
                plaintext: string;
            };

            type Result = Promise<Nullable<Entities.RecoveryCode>>;

            type Signature = (props: Props) => Result;
        }

        namespace CheckPasswordHistory {
            type Props = {
                password: string;
                account: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            resetByRecoveryCode: ResetByRecoveryCode.Signature;
            requestOTP: RequestOTP.Signature;
            resetByOTP: ResetByOTP.Signature;
            change: Change.Signature;
        }

        namespace ResetByRecoveryCode {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace RequestOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace ResetByOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    password: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Change {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    currentPassword: string;
                    newPassword: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
