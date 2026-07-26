import { Collection } from "@mikro-orm/postgresql";

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

                sessions: Collection<Entities.Session>;
                secondFactors: Collection<Entities.SecondFactor>;
                recoveryCodes: Collection<Entities.RecoveryCode>;
                passwordHistory: Collection<Entities.PasswordHistory>;
                identifiers: Collection<Entities.Identifier>;
                memberships: Collection<Entities.Membership>;

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
