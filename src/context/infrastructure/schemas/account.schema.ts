import { EntitySchema } from "@mikro-orm/core";

import { AccountSubject, AccountStatus } from "~context/enums";
import { Account } from "~context/domain/entities";

export const AccountSchema = new EntitySchema<Account>({
    class: Account,
    tableName: "account",
    schema: "identity",

    properties: {
        id: { primary: true, type: "uuid" },

        subject: { enum: true, items: () => AccountSubject },
        status: { enum: true, items: () => AccountStatus },
        is2FAEnforced: { type: "boolean" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
