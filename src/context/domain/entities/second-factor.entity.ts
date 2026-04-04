import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";
import { SecondFactorStatus, SecondFactorType } from "~context/enums";

import { Account } from "./account.entity";

export class SecondFactor {
    private get dictionaryPath(): string {
        return "entities.second-factor";
    }

    public id: string;
    public createdAt: Date;
    public confirmedAt?: Date;
    public lastUsedAt?: Date;
    public revokedAt?: Date;

    public status: SecondFactorStatus;
    public type: SecondFactorType;
    public secret: string;
    public name: string;

    public account: Account;

    public constructor(props: Entities.SecondFactor.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.status = SecondFactorStatus.PENDING;

        this.secret = props.secret;
        this.name = props.name;
        this.type = props.type;

        this.account = props.account;
    }

    public confirm(): void {
        if (this.status === SecondFactorStatus.PENDING) {
            this.status = SecondFactorStatus.ACTIVE;
            this.confirmedAt = new Date();
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CONFIRM_NOT_ALLOWED`);
        }
    }

    public revoke(): void {
        if (this.status === SecondFactorStatus.ACTIVE) {
            this.status = SecondFactorStatus.REVOKED;
            this.revokedAt = new Date();
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.REVOKE_NOT_ALLOWED`);
        }
    }

    public restore(): void {
        if (this.status === SecondFactorStatus.REVOKED) {
            this.status = SecondFactorStatus.ACTIVE;
            this.revokedAt = undefined;
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.RESTORE_NOT_ALLOWED`);
        }
    }

    public canPurge(): void {
        if (this.status === SecondFactorStatus.ACTIVE) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.CANNOT_PURGE_ACTIVE`);
        }
    }
}
