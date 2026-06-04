import { Account } from "./account.entity";

export class Membership {
    public invitedBy: string;
    public createdAt: Date;
    public joinedAt: Date;
    public realm: string;

    public account: Account;

    public constructor(props: Entities.Membership.ConstructorProps) {
        this.createdAt = new Date();

        this.invitedBy = props.invitedBy;
        this.joinedAt = props.joinedAt;
        this.account = props.account;
        this.realm = props.realm;
    }
}
