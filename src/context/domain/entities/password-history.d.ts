declare namespace Entities {
    type PasswordHistory = PasswordHistory.Contract;

    namespace PasswordHistory {
        interface Contract {
            id: string;
            setAt: Date;

            version: number;
            hash: string;

            account: Entities.Account;
        }

        type ConstructorProps = {
            account: Entities.Account;
            version: number;
            hash: string;
        };
    }
}
