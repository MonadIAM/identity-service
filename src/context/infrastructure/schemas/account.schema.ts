import { EntitySchema } from "@mikro-orm/core";

import { AccountSubject, AccountStatus } from "~context/enums";
import {
    PasswordHistory,
    SecondFactor,
    RecoveryCode,
    Membership,
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

        subject: { enum: true, items: () => AccountSubject, nativeEnumName: "account_subject" },
        status: { enum: true, items: () => AccountStatus, nativeEnumName: "account_status" },
        is2FAEnforced: { type: "boolean", fieldName: "is_2fa_enforced" },

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

        memberships: {
            kind: "1:m",
            entity: () => Membership,
            mappedBy: "account",
        },

        lastActiveAt: { type: "timestamptz", length: 3, nullable: true },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int" },
    },
});
