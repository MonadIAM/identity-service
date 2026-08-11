import { AccountSubject, AccountStatus } from "~context/enums";

declare global {
    namespace Entities {
        type Account = Account.Contract;

        namespace Account {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                lastActiveAt?: Date;
                version: number;

                is2FAEnforced: boolean;
                subject: AccountSubject;
                status: AccountStatus;

                profile?: Profile;
                password?: Password;
                masterCode?: Entities.MasterCode;

                sessions: ORM.Collection<Entities.Session>;
                secondFactors: ORM.Collection<Entities.SecondFactor>;
                recoveryCodes: ORM.Collection<Entities.RecoveryCode>;
                passwordHistory: ORM.Collection<Entities.PasswordHistory>;
                identifiers: ORM.Collection<Entities.Identifier>;
                memberships: ORM.Collection<Entities.Membership>;
                receivedInvites: ORM.Collection<Entities.Invite>;
                sentInvites: ORM.Collection<Entities.Invite>;

                assignRelations(props: AssignRelations): void;
                deactivate(): void;
                unsuspend(): void;
                activate(): void;
                restore(): void;
                suspend(): void;
                touch(): void;
            }

            type ConstructorProps = {
                subject: AccountSubject;
                status: AccountStatus;
            };

            type AssignRelations = {
                identifier: Entities.Identifier;
                password?: Entities.Password;
                profile: Entities.Profile;
            };
        }
    }
}
