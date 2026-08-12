declare namespace Entities {
    type MembershipHistory = MembershipHistory.Contract;

    namespace MembershipHistory {
        interface Contract {
            id: string;
            createdAt: Date;

            realm: string;
            account: string;

            invitedBy: string;
            excludedBy?: string;

            joinedAt: Date;
            leaveAt?: Date;

            close(excludedBy: string): void;
        }

        type ConstructorProps = {
            invitedBy: string;
            account: string;
            joinedAt: Date;
            realm: string;
        };
    }
}
