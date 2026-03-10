import { randomUUID } from "node:crypto";

import { EntityException } from "~common/exceptions";

import { Account } from "./account.entity";

export class Session {
    private get dictionaryPath(): string {
        return "entities.session";
    }

    public id: string;
    public createdAt: Date;
    public expiresAt: Date;
    public lastActiveAt: Date;

    public refreshTokenHash: string;
    public userAgent: string;
    public ip: string;

    public account: Account;

    public constructor(props: Entities.Session.ConstructorProps) {
        const now = new Date();

        this.id = randomUUID();
        this.lastActiveAt = now;
        this.createdAt = now;

        this.expiresAt = props.expiresAt;

        this.refreshTokenHash = props.refreshTokenHash;
        this.userAgent = props.userAgent;
        this.ip = props.ip;

        this.account = props.account;
    }

    public refresh(hash: string): void {
        this.lastActiveAt = new Date();
        this.refreshTokenHash = hash;
    }

    public isExpired(): void {
        if (this.expiresAt < new Date()) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.`);
        }
    }
}
