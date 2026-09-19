import { randomUUID } from "node:crypto";

import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

export class InterfaceClient implements Entities.InterfaceClient.Contract {
    private static readonly dictionaryPath = "entities.interface-client";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public realm: string;
    public name: string;
    public description?: string;

    public authAddress: string;
    public redirectUris: string[];
    public grantTypes: TokenGrantType[];

    public realmVersion: number;
    public isSystemManaged: boolean;
    public isRealmRevoked: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.InterfaceClient.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.realmVersion = props.realmVersion ?? 0;
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRealmRevoked = props.isRealmRevoked ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.realm = props.realm;
        this.name = props.name;
        this.description = props.description;

        this.authAddress = props.authAddress;
        this.redirectUris = props.redirectUris;
        this.grantTypes = props.grantTypes;
    }

    public update(patch: Entities.InterfaceClient.ChangeDataProps): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${InterfaceClient.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE`,
            });
        }

        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.CANNOT_UPDATE_REVOKED` });
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
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.NO_CHANGES_DETECTED` });
        } else {
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.EMPTY_UPDATE_PATCH` });
        }
    }

    public revoke(): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${InterfaceClient.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE`,
            });
        }

        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            this.isRevoked = true;
            this.updatedAt = new Date();
        }
    }

    public restore(): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${InterfaceClient.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE`,
            });
        }

        if (this.isRevoked) {
            this.isRevoked = false;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({
                messageKey: `${InterfaceClient.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE`,
            });
        }

        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${InterfaceClient.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
        }
    }

    public applyRealmRevocation(version: number): void {
        if (!this.isSystemManaged && version > this.realmVersion) {
            this.isRealmRevoked = true;
            this.realmVersion = version;
            this.updatedAt = new Date();
        }
    }

    public applyRealmRestore(version: number): void {
        if (!this.isSystemManaged && version > this.realmVersion) {
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
