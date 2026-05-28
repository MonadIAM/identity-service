import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";
import { SecondFactorType } from "~context/enums";

import { Account } from "./account.entity";

export class SecondFactor {
    private get dictionaryPath(): string {
        return "entities.second-factor";
    }

    public id: string;
    public createdAt: Date;
    public confirmedAt?: Date;
    public lastUsedAt?: Date;

    public type: SecondFactorType;
    public secret: string;
    public name: string;

    public account: Account;

    public constructor(props: Entities.SecondFactor.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.secret = props.secret;
        this.name = props.name;
        this.type = props.type;

        this.account = props.account;
    }

    public confirm(): void {
        if (this.confirmedAt) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CONFIRM_NOT_ALLOWED`);
        } else {
            this.confirmedAt = new Date();
        }
    }
}
