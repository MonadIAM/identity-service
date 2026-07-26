import { randomUUID } from "node:crypto";

export class RecoveryCode implements Entities.RecoveryCode.Contract {
    public id: string;
    public createdAt: Date;
    public usedAt?: Date;

    public hash: string;

    public account: Entities.Account;

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
