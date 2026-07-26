export class MasterCode implements Entities.MasterCode.Contract {
    public hash: string;
    public createdAt: Date;

    public account: Entities.Account;

    public constructor(props: Entities.MasterCode.ConstructorProps) {
        this.createdAt = new Date();

        this.hash = props.hash;

        this.account = props.account;
    }
}
