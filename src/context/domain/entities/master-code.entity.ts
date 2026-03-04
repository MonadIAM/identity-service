import { Account } from "./account.entity";

export class MasterCode {
    public hash: string;
    public createdAt: Date;

    public account: Account;

    public constructor(props: Entities.MasterCode.ConstructorProps) {
        this.createdAt = new Date();

        this.hash = props.hash;

        this.account = props.account;
    }
}
