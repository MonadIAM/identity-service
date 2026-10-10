declare namespace Services.Password {
    interface Contract extends InternalContract, CommandContract {}

    interface InternalContract {
        findMatchingRecoveryCode: FindMatchingRecoveryCode.Signature;
        checkHistory: CheckHistory.Signature;
    }

    namespace FindMatchingRecoveryCode {
        type Props = {
            codes: Entities.RecoveryCode[];
            plaintext: string;
        };

        type Result = Promise<Nullable<Entities.RecoveryCode>>;

        type Signature = (props: Props) => Result;
    }

    namespace CheckHistory {
        type Props = {
            password: string;
            account: string;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    interface CommandContract {
        resetByRecoveryCode: ResetByRecoveryCode.Signature;
        resetByOTP: ResetByOTP.Signature;
        change: Change.Signature;
        rotate: Rotate.Signature;
    }

    namespace Change {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                currentPassword: string;
                newPassword: string;
                account: string;
            };
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace ResetByOTP {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                password: string;
                account: string;
            };
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace ResetByRecoveryCode {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                identifier: string;
                password: string;
                code: string;
            };
        };

        type Result = Promise<Entities.Account>;

        type Signature = (props: Props) => Result;
    }

    namespace Rotate {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                password: Entities.Password;
                newHash: string;
            };
        };

        type Result = void;

        type Signature = (props: Props) => Result;
    }
}
