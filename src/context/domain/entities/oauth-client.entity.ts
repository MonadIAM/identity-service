import { randomUUID } from "node:crypto";

import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

export class OAuthClient {
    private get dictionaryPath(): string {
        return "entities.oauth-client";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version = 1;

    public description?: string;
    public redirectUri: string;
    public realm: string;
    public name: string;
    public grantTypes: TokenGrantType[];

    public isRealmRevoked: boolean;
    public isRevoked: boolean;
    public realmVersion: number;

    public constructor(props: Entities.OAuthClient.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isRealmRevoked = props.isRealmRevoked ?? false;
        this.isRevoked = props.isRevoked ?? false;
        this.realmVersion = props.realmVersion ?? 0;

        this.description = props.description;
        this.redirectUri = props.redirectUri;
        this.grantTypes = props.grantTypes;
        this.realm = props.realm;
        this.name = props.name;
    }

    public update(patch: Entities.OAuthClient.ChangeDataProps): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_UPDATE_REVOKED` });
        }

        let affected = 0;
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && this.hasChanged(this[key], value)) {
                (this[key] as unknown) = value;
                ++affected;
            }
        }

        if (affected) {
            this.updatedAt = new Date();
        } else if (Object.keys(patch).length) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.NO_CHANGES_DETECTED` });
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public revoke(): void {
        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            this.isRevoked = true;
            this.updatedAt = new Date();
        }
    }

    public restore(): void {
        if (this.isRevoked) {
            this.isRevoked = false;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        }
    }

    public applyRealmRevocation(version: number): void {
        if (version > this.realmVersion) {
            this.isRealmRevoked = true;
            this.realmVersion = version;
            this.updatedAt = new Date();
        }
    }

    public applyRealmRestore(version: number): void {
        if (version > this.realmVersion) {
            this.isRealmRevoked = false;
            this.realmVersion = version;
            this.updatedAt = new Date();
        }
    }

    private hasChanged(current: unknown, next: unknown): boolean {
        if (Array.isArray(current) && Array.isArray(next)) {
            return current.length !== next.length || current.some((value, index) => value !== next[index]);
        } else {
            return current !== next;
        }
    }
}
