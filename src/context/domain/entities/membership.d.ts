declare namespace Entities {
    type Membership = Membership.Contract;

    namespace Membership {
        interface Contract {
            invitedBy: string;
            createdAt: Date;
            joinedAt: Date;
            realm: string;

            account: Entities.Account;
        }

        type ConstructorProps = {
            account: Entities.Account;
            invitedBy: string;
            joinedAt: Date;
            realm: string;
        };
    }
}
