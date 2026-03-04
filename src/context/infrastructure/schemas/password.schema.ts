import { EntitySchema } from "@mikro-orm/core";

import { Password, Account } from "~context/domain/entities";

export const PasswordSchema = new EntitySchema<Password>({
    class: Password,
    tableName: "password",
    schema: "identity",

    properties: {
        account: {
            kind: "1:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
            primary: true,
            owner: true,
        },

        hash: { type: "text" },
        version: { type: "int" },
        setAt: { type: "timestamptz", length: 3 },
    },
});
