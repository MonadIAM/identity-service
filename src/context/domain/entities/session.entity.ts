import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

import { Account } from "./account.entity";

export class Session {
    private get dictionaryPath(): string {
        return "entities.session";
    }

    public id: string;
    public createdAt: Date;
    public expiresAt: Date;
    public lastRefreshedAt: Date;

    public refreshTokenHash?: string;
    public userAgent: string;
    public realms: string[];
    public client: string;
    public ip: string;

    public account: Account;

    public constructor(props: Entities.Session.ConstructorProps) {
        const now = new Date();

        this.createdAt = now;
        this.lastRefreshedAt = now;
        this.id = randomUUID();

        this.expiresAt = props.expiresAt;

        this.userAgent = props.userAgent;
        this.client = props.client;
        this.realms = props.realms;
        this.ip = props.ip;

        this.account = props.account;
    }

    public refresh(hash: string): void {
        this.lastRefreshedAt = new Date();
        this.refreshTokenHash = hash;
    }

    public isExpired(): void {
        if (this.expiresAt < new Date()) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.EXPIRED` });
        }
    }
}
