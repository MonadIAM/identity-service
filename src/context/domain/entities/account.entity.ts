import { Collection } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { AccountSubject, AccountStatus } from "~context/enums";
import { Exception } from "~common/exceptions";

export class Account implements Entities.Account.Contract {
    private static readonly dictionaryPath = "entities.account";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public lastActiveAt?: Date;
    public version: number = 1;

    public is2FAEnforced: boolean;
    public subject: AccountSubject;
    public status: AccountStatus;

    public profile?: Entities.Profile;
    public password?: Entities.Password;
    public masterCode?: Entities.MasterCode;

    public sessions = new Collection<Entities.Session>(this);
    public identifiers = new Collection<Entities.Identifier>(this);
    public secondFactors = new Collection<Entities.SecondFactor>(this);
    public recoveryCodes = new Collection<Entities.RecoveryCode>(this);
    public passwordHistory = new Collection<Entities.PasswordHistory>(this);

    public constructor(props: Entities.Account.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.is2FAEnforced = false;

        this.subject = props.subject;
        this.status = props.status;
    }

    public touch(): void {
        this.lastActiveAt = new Date();
    }

    public assignRelations(props: Entities.Account.AssignRelations): void {
        this.password = props.password;
        this.profile = props.profile;
    }

    public activate(): void {
        if (this.status === AccountStatus.PENDING) {
            this.status = AccountStatus.ACTIVE;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${Account.dictionaryPath}.ALREADY_ACTIVATED` });
        }
    }

    public deactivate(): void {
        if (this.status === AccountStatus.ACTIVE) {
            this.status = AccountStatus.DEACTIVATED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${Account.dictionaryPath}.DEACTIVATION_NOT_ALLOWED` });
        }
    }

    public restore(): void {
        if (this.status === AccountStatus.DEACTIVATED) {
            this.status = AccountStatus.ACTIVE;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${Account.dictionaryPath}.RESTORE_NOT_ALLOWED` });
        }
    }

    public suspend(): void {
        if (this.status === AccountStatus.SUSPENDED) {
            throw Exception.invariantViolation({ messageKey: `${Account.dictionaryPath}.ALREADY_SUSPENDED` });
        } else {
            this.status = AccountStatus.SUSPENDED;
            this.updatedAt = new Date();
        }
    }

    public unsuspend(): void {
        if (this.status === AccountStatus.SUSPENDED) {
            this.status = AccountStatus.ACTIVE;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${Account.dictionaryPath}.NOT_SUSPENDED` });
        }
    }
}
