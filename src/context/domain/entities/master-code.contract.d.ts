declare namespace Entities {
    type MasterCode = MasterCode.Contract;

    namespace MasterCode {
        interface Contract {
            hash: string;
            createdAt: Date;
            account: Entities.Account;
        }

        type ConstructorProps = {
            account: Entities.Account;
            hash: string;
        };
    }
}
