import { randomUUID } from "node:crypto";

import { Account } from "./account.entity";

export class RecoveryCode {
    public id: string;
    public createdAt: Date;
    public usedAt?: Date;

    public hash: string;

    public account: Account;

    public constructor(props: Entities.RecoveryCode.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.hash = props.hash;

        this.account = props.account;
    }

    public use(): void {
        this.usedAt = new Date();
    }
}
