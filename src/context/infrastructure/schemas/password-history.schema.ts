import { EntitySchema } from "@mikro-orm/core";

import { PasswordHistory, Account } from "~context/domain/entities";

export const PasswordHistorySchema = new EntitySchema<PasswordHistory>({
    class: PasswordHistory,
    tableName: "password_history",
    schema: "identity",

    uniques: [
        {
            name: "password_history_account_version_unique",
            properties: ["account", "version"],
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
        version: { type: "int" },
        setAt: { type: "timestamptz", length: 3 },
    },
});
