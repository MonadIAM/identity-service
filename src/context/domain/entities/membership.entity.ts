export class Membership implements Entities.Membership.Contract {
    public invitedBy: string;
    public createdAt: Date;
    public joinedAt: Date;
    public realm: string;

    public account: Entities.Account;

    public constructor(props: Entities.Membership.ConstructorProps) {
        this.createdAt = new Date();

        this.invitedBy = props.invitedBy;
        this.joinedAt = props.joinedAt;
        this.account = props.account;
        this.realm = props.realm;
    }
}
