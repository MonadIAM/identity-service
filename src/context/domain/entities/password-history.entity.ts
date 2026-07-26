import { randomUUID } from "node:crypto";

export class PasswordHistory implements Entities.PasswordHistory.Contract {
    public id: string;
    public setAt: Date;

    public version: number;
    public hash: string;

    public account: Entities.Account;

    public constructor(props: Entities.PasswordHistory.ConstructorProps) {
        this.setAt = new Date();
        this.id = randomUUID();

        this.version = props.version;
        this.hash = props.hash;

        this.account = props.account;
    }
}
