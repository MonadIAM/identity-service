import { Account } from "./account.entity";

export class Profile {
    public updatedAt?: Date;

    public displayName: string;
    public pictureUrl?: string;
    public timeZone?: string;
    public locale?: string;

    public account: Account;

    public constructor(props: Entities.Profile.ConstructorProps) {
        this.displayName = props.displayName;
        this.timeZone = props.timeZone;
        this.locale = props.locale;

        this.account = props.account;
    }
}
