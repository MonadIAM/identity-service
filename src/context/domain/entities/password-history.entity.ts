import { randomUUID } from "node:crypto";

import { Account } from "./account.entity";

export class PasswordHistory {
    public id: string;
    public setAt: Date;
    public version: number = 1;

    public hash: string;

    public account: Account;

    public constructor(props: Entities.PasswordHistory.ConstructorProps) {
        this.setAt = new Date();
        this.id = randomUUID();

        this.hash = props.hash;

        this.account = props.account;
    }
}
