import { EntitySchema } from "@mikro-orm/core";

import { Account, Membership } from "~context/domain/entities";

export const MembershipSchema = new EntitySchema<Membership>({
    class: Membership,
    tableName: "membership",
    schema: "identity",

    properties: {
        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
            primary: true,
        },

        realm: {
            type: "uuid",
            fieldName: "realm_id",
            primary: true,
        },

        invitedBy: { type: "uuid", fieldName: "invited_by" },
        createdAt: { type: "timestamptz", length: 3 },
        joinedAt: { type: "timestamptz", length: 3 },
    },
});
