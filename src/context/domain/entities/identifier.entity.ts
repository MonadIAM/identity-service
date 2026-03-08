import { randomUUID } from "node:crypto";

import { IdentifierType } from "~context/enums";

import { Account } from "./account.entity";

export class Identifier {
    public id: string;
    public createdAt: Date;
    public verifiedAt?: Date;
    public lastUsedAt?: Date;

    public type: IdentifierType;
    public value: string;

    public providerUserId?: string;
    public provider?: string;

    public isVerified: boolean;
    public usableAs2FA: boolean;
    public receiveNotifications: boolean;

    public account: Account;
    public primaryOfAccount: Account;

    public constructor(props: Entities.Identifier.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isVerified = false;
        this.usableAs2FA = false;
        this.receiveNotifications = false;

        this.type = props.type;
        this.value = props.value;

        this.providerUserId = props.providerUserId;
        this.provider = props.provider;

        this.primaryOfAccount = props.account;
        this.account = props.account;
    }
}
