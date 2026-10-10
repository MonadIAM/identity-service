declare namespace Entities {
    type Password = Password.Contract;

    namespace Password {
        interface Contract {
            setAt: Date;
            version: number;

            hash: string;

            account: Entities.Account;

            rotate(hash: string): Previous;
        }

        type ConstructorProps = {
            account: Entities.Account;
            hash: string;
        };

        type Previous = {
            version: number;
            hash: string;
        };
    }
}
