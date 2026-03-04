import { Collection } from "@mikro-orm/postgresql";
import { randomUUID } from "node:crypto";

import { AccountSubject, AccountStatus } from "~context/enums";

import { PasswordHistory } from "./password-history.entity";
import { SecondFactor } from "./second-factor.entity";
import { RecoveryCode } from "./recovery-code.entity";
import { Notification } from "./notification.entity";
import { MasterCode } from "./master-code.entity";
import { Identifier } from "./identifier.entity";
import { Password } from "./password.entity";
import { Profile } from "./profile.entity";
import { Session } from "./session.entity";

export class Account {
    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version = 1;

    public is2FAEnforced: boolean;
    public subject: AccountSubject;
    public status: AccountStatus;

    public primaryIdentifier!: Identifier;
    public masterCode!: MasterCode;
    public password!: Password;
    public profile!: Profile;

    public sessions = new Collection<Session>(this);
    public identifiers = new Collection<Identifier>(this);
    public secondFactors = new Collection<SecondFactor>(this);
    public recoveryCodes = new Collection<RecoveryCode>(this);
    public passwordHistory = new Collection<PasswordHistory>(this);
    public notifications = new Collection<Notification>(this);

    public constructor(props: Entities.Account.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.is2FAEnforced = false;

        this.subject = props.subject;
        this.status = props.status;
    }
}
