import { Account } from "./account.entity";

export class Password {
    public setAt: Date;
    public version: number = 1;

    public hash: string;

    public account: Account;

    public constructor(props: Entities.Password.ConstructorProps) {
        this.setAt = new Date();

        this.hash = props.hash;

        this.account = props.account;
    }
}
