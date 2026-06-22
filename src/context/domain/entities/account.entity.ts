import { Collection } from "@mikro-orm/postgresql";
import { randomUUID } from "node:crypto";

import { AccountSubject, AccountStatus } from "~context/enums";
import { Exception } from "~common/exceptions";

import { PasswordHistory } from "./password-history.entity";
import { SecondFactor } from "./second-factor.entity";
import { RecoveryCode } from "./recovery-code.entity";
import { MasterCode } from "./master-code.entity";
import { Identifier } from "./identifier.entity";
import { Password } from "./password.entity";
import { Profile } from "./profile.entity";
import { Session } from "./session.entity";
import type { Membership } from "./membership.entity";

export class Account {
    private get dictionaryPath(): string {
        return "entities.account";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public lastActiveAt?: Date;
    public version = 1;

    public is2FAEnforced: boolean;
    public subject: AccountSubject;
    public status: AccountStatus;

    public profile?: Profile;
    public password?: Password;
    public masterCode?: MasterCode;

    public sessions = new Collection<Session>(this);
    public identifiers = new Collection<Identifier>(this);
    public secondFactors = new Collection<SecondFactor>(this);
    public recoveryCodes = new Collection<RecoveryCode>(this);
    public passwordHistory = new Collection<PasswordHistory>(this);
    public memberships = new Collection<Membership>(this);

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
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_ACTIVATED` });
        }
    }

    public deactivate(): void {
        if (this.status === AccountStatus.ACTIVE) {
            this.status = AccountStatus.DEACTIVATED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.DEACTIVATION_NOT_ALLOWED` });
        }
    }

    public restore(): void {
        if (this.status === AccountStatus.DEACTIVATED) {
            this.status = AccountStatus.ACTIVE;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.RESTORE_NOT_ALLOWED` });
        }
    }

    public suspend(): void {
        if (this.status === AccountStatus.SUSPENDED) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_SUSPENDED` });
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
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.NOT_SUSPENDED` });
        }
    }
}
