import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class ServiceClient implements Entities.ServiceClient.Contract {
    private get dictionaryPath(): string {
        return "entities.service-client";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public code: string;
    public name: string;
    public application: Entities.Application;
    public description?: string;
    public allowedAddresses: string[];

    public applicationVersion: number;
    public isSystemManaged: boolean;
    public isApplicationRevoked: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.ServiceClient.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.applicationVersion = props.applicationVersion ?? 0;
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isApplicationRevoked = props.isApplicationRevoked ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.allowedAddresses = props.allowedAddresses ?? [];
        this.application = props.application;
        this.description = props.description;
        this.code = props.code;
        this.name = props.name;
    }

    public update(patch: Entities.ServiceClient.ChangeDataProps): void {
        if (this.isSystemManaged) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.SYSTEM_MANAGED_IMMUTABLE` });
        }

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

    public applyApplicationRevocation(version: number): void {
        if (!this.isSystemManaged && version > this.applicationVersion) {
            this.isApplicationRevoked = true;
            this.applicationVersion = version;
            this.updatedAt = new Date();
        }
    }

    public applyApplicationRestore(version: number): void {
        if (!this.isSystemManaged && version > this.applicationVersion) {
            this.isApplicationRevoked = false;
            this.applicationVersion = version;
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
