import { randomUUID } from "node:crypto";

import { ErrorCode, Exception } from "~common/exceptions";

export class Session implements Entities.Session.Contract {
    private static readonly dictionaryPath = "entities.session";

    public id: string;
    public createdAt: Date;
    public expiresAt: Date;
    public lastRefreshedAt: Date;

    public refreshTokenHash?: string;
    public userAgent: string;
    public realms: string[];
    public client: string;
    public scope: string;
    public ip: string;
    public acr: string;

    public account: Entities.Account;

    public constructor(props: Entities.Session.ConstructorProps) {
        const now = new Date();

        this.createdAt = now;
        this.lastRefreshedAt = now;
        this.id = randomUUID();

        this.expiresAt = props.expiresAt;

        this.userAgent = props.userAgent;
        this.client = props.client;
        this.realms = props.realms;
        this.scope = props.scope;
        this.acr = props.acr;
        this.ip = props.ip;

        this.account = props.account;
    }

    public refresh(hash: string): void {
        this.lastRefreshedAt = new Date();
        this.refreshTokenHash = hash;
    }

    public isExpired(): void {
        if (this.expiresAt < new Date()) {
            throw Exception.badRequest({
                messageKey: `${Session.dictionaryPath}.SESSION_EXPIRED`,
                code: ErrorCode.INVALID_GRANT,
            });
        }
    }
}
