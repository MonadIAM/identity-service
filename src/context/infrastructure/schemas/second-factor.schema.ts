import { EntitySchema } from "@mikro-orm/core";

import { SecondFactor, Account } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

export const SecondFactorSchema = new EntitySchema<SecondFactor>({
    class: SecondFactor,
    tableName: "second_factor",
    schema: "identity",

    uniques: [
        {
            name: "second_factor_account_type_unique",
            properties: ["account", "type"],
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

        type: { enum: true, items: () => SecondFactorType },
        secret: { type: "text" },
        name: { type: "string", length: 128, nullable: true },
        isPreferred: { type: "boolean" },

        confirmedAt: { type: "timestamptz", length: 3, nullable: true },
        lastUsedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
