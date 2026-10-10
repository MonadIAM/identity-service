declare namespace Entities {
    type RecoveryCode = RecoveryCode.Contract;

    namespace RecoveryCode {
        interface Contract {
            id: string;
            createdAt: Date;
            usedAt?: Date;

            hash: string;

            account: Entities.Account;

            use(): void;
        }

        type ConstructorProps = {
            account: Entities.Account;
            hash: string;
        };
    }
}
