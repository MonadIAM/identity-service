import { EntitySchema } from "@mikro-orm/core";

import { RecoveryCode, Account } from "~context/domain/entities";

export const RecoveryCodeSchema = new EntitySchema<RecoveryCode>({
    class: RecoveryCode,
    tableName: "recovery_code",
    schema: "identity",

    uniques: [
        {
            name: "recovery_code_account_hash_unique",
            properties: ["account", "hash"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
        },

        hash: { type: "text" },
        usedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
