import { EntitySchema } from "@mikro-orm/core";

import { Account, MasterCode } from "~context/domain/entities";

export const MasterCodeSchema = new EntitySchema<MasterCode>({
    class: MasterCode,
    tableName: "master_code",
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
        createdAt: { type: "timestamptz", length: 3 },
    },
});
