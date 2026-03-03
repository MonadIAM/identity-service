import { randomUUID } from "node:crypto";

import { AccountSubject, AccountStatus } from "~context/enums";

export class Account {
    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version = 1;

    public is2FAEnforced: boolean;
    public subject: AccountSubject;
    public status: AccountStatus;

    public constructor(props: Entities.Account.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.is2FAEnforced = false;

        this.subject = props.subject;
        this.status = props.status;
    }
}
