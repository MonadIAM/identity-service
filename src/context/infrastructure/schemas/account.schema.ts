import { EntitySchema } from "@mikro-orm/core";

import { AccountSubject, AccountStatus } from "~context/enums";
import {
    PasswordHistory,
    Notification,
    SecondFactor,
    RecoveryCode,
    Identifier,
    MasterCode,
    Password,
    Profile,
    Session,
    Account,
} from "~context/domain/entities";

export const AccountSchema = new EntitySchema<Account>({
    class: Account,
    tableName: "account",
    schema: "identity",

    properties: {
        id: { primary: true, type: "uuid" },

        subject: { enum: true, items: () => AccountSubject },
        status: { enum: true, items: () => AccountStatus },
        is2FAEnforced: { type: "boolean" },

        primaryIdentifier: {
            kind: "1:1",
            entity: () => Identifier,
            fieldName: "primary_identifier_id",
            nullable: true,
        },

        masterCode: {
            kind: "1:1",
            entity: () => MasterCode,
            mappedBy: "account",
            nullable: true,
        },

        password: {
            kind: "1:1",
            entity: () => Password,
            mappedBy: "account",
            nullable: true,
        },

        profile: {
            kind: "1:1",
            entity: () => Profile,
            mappedBy: "account",
        },

        identifiers: {
            kind: "1:m",
            entity: () => Identifier,
            mappedBy: "account",
        },

        secondFactors: {
            kind: "1:m",
            entity: () => SecondFactor,
            mappedBy: "account",
        },

        recoveryCodes: {
            kind: "1:m",
            entity: () => RecoveryCode,
            mappedBy: "account",
        },

        passwordHistory: {
            kind: "1:m",
            entity: () => PasswordHistory,
            mappedBy: "account",
        },

        sessions: {
            kind: "1:m",
            entity: () => Session,
            mappedBy: "account",
        },

        notifications: {
            kind: "1:m",
            entity: () => Notification,
            mappedBy: "account",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int" },
    },
});
