import { randomUUID } from "node:crypto";

import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

export class InterfaceClient implements Entities.InterfaceClient.Contract {
    private static readonly dictionaryPath = "entities.interface-client";

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public name: string;
    public application: Entities.Application;
    public authAddress: string;
    public description?: string;
    public redirectUris: string[];
    public grantTypes: TokenGrantType[];

    public applicationVersion: number;
    public isSystemManaged: boolean;
    public isApplicationRevoked: boolean;
    public isRevoked: boolean;

    public constructor(props: Entities.InterfaceClient.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.applicationVersion = props.applicationVersion ?? 0;
        this.isSystemManaged = props.isSystemManaged ?? false;
        this.isApplicationRevoked = props.isApplicationRevoked ?? false;
        this.isRevoked = props.isRevoked ?? false;

        this.redirectUris = props.redirectUris;
        this.application = props.application;
        this.description = props.description;
        this.authAddress = props.authAddress;
        this.grantTypes = props.grantTypes;
        this.name = props.name;
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
            if (typeof value !== "undefined") {
                const current = this[key];
                const isChanged =
                    Array.isArray(current) && Array.isArray(value)
                        ? current.length !== value.length || current.some((item, index) => item !== value[index])
                        : current !== value;

                if (isChanged) {
                    (this[key] as unknown) = value;
                    ++affected;
                }
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
}
