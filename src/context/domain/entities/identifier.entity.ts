import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";

import { Account } from "./account.entity";

export class Identifier {
    private get dictionaryPath(): string {
        return "entities.identifier";
    }

    public id: string;
    public createdAt: Date;
    public verifiedAt?: Date;
    public lastUsedAt?: Date;

    public type: IdentifierType;
    public value: string;

    public providerUserId?: string;
    public provider?: string;

    public isVerified: boolean;
    public receiveNotifications: boolean;
    public allowPasswordlessLogin: boolean;

    public account: Account;
    public primaryOfAccount?: Account;

    public constructor(props: Entities.Identifier.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isVerified = false;
        this.receiveNotifications = false;
        this.allowPasswordlessLogin = false;

        this.type = props.type;
        this.value = props.value;

        this.providerUserId = props.providerUserId;
        this.provider = props.provider;

        this.account = props.account;
    }

    public toggleNotifications(): void {
        if (this.type === IdentifierType.EMAIL) {
            this.receiveNotifications = !this.receiveNotifications;
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NOTIFICATIONS_EMAIL_ONLY`);
        }
    }

    public togglePasswordlessLogin(): void {
        if ([IdentifierType.EMAIL, IdentifierType.PHONE].includes(this.type)) {
            this.allowPasswordlessLogin = !this.allowPasswordlessLogin;
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.PASSWORDLESS_NOT_APPLICABLE`);
        }
    }

    public verify(): void {
        if (this.isVerified) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_VERIFIED`);
        } else {
            this.verifiedAt = new Date();
            this.isVerified = true;
        }
    }

    public canRemove(): void {
        if (this.primaryOfAccount) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_REMOVE_PRIMARY`);
        }
    }

    public canSetAsPrimary(): void {
        if (!this.isVerified) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.PRIMARY_MUST_BE_VERIFIED`);
        } else if (this.primaryOfAccount) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.ALREADY_PRIMARY`);
        }
    }
}
