import { Collection } from "@mikro-orm/postgresql";
import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class Application implements Entities.Application.Contract {
    private get dictionaryPath(): string {
        return "entities.application";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public description?: string;
    public realm: string;
    public name: string;

    public realmVersion: number;
    public isSystemManaged: boolean;
    public isRealmRevoked: boolean;
    public isRevoked: boolean;

    public interfaceClients = new Collection<Entities.InterfaceClient>(this);
    public serviceClients = new Collection<Entities.ServiceClient>(this);

    public constructor(props: Entities.Application.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.realmVersion = props.realmVersion ?? 0;
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isRealmRevoked = props.isRealmRevoked ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.description = props.description;
        this.realm = props.realm;
        this.name = props.name;
    }

    public update(patch: Entities.Application.ChangeDataProps): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE` });
        }

        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_UPDATE_REVOKED` });
        }

        let affected = 0;
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
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
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE` });
        }

        if (this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_REVOKED` });
        } else {
            this.isRevoked = true;
            this.updatedAt = new Date();
        }
    }

    public restore(): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE` });
        }

        if (this.isRevoked) {
            this.isRevoked = false;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_ACTIVE` });
        }
    }

    public canPurge(): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE` });
        }

        if (!this.isRevoked) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_PURGE_ACTIVE` });
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
}
