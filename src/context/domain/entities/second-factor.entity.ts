import { randomUUID } from "node:crypto";

import { SecondFactorType } from "~context/enums";

import { Account } from "./account.entity";

export class SecondFactor {
    public id: string;
    public createdAt: Date;
    public lastUsedAt?: Date;
    public confirmedAt?: Date;

    public isPreferred: boolean;
    public type: SecondFactorType;
    public secret: string;
    public name: string;

    public account: Account;

    public constructor(props: Entities.SecondFactor.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isPreferred = props.isPreferred;
        this.secret = props.secret;
        this.name = props.name;
        this.type = props.type;

        this.account = props.account;
    }
}
