export class Password implements Entities.Password.Contract {
    public setAt: Date;
    public version: number = 1;

    public hash: string;

    public account: Entities.Account;

    public constructor(props: Entities.Password.ConstructorProps) {
        this.setAt = new Date();

        this.hash = props.hash;

        this.account = props.account;
    }

    public rotate(hash: string): Entities.Password.Previous {
        const history = {
            version: this.version,
            hash: this.hash,
        };
        this.hash = hash;
        ++this.version;
        return history;
    }
}
