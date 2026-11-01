declare namespace Commands.Password {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        resetByRecoveryCode: ResetByRecoveryCode.Signature;
        requestOTP: RequestOTP.Signature;
        resetByOTP: ResetByOTP.Signature;
        change: Change.Signature;
        set: Set.Signature;
    }

    namespace Set {
        type Props = {
            context: Extract.Meta;
            actor: string;
            input: {
                password: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace ResetByRecoveryCode {
        type Props = {
            context: Extract.Meta;
            actor?: string;
            input: ({ identifier: string } | { account: string }) & {
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
            actor?: string;
            input: { identifier: string } | { account: string };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace ResetByOTP {
        type Props = {
            context: Extract.Meta;
            actor?: string;
            input: {
                account?: string;
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
                newPassword: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
