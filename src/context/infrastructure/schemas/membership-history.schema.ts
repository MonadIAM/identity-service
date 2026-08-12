import { EntitySchema } from "@mikro-orm/core";

import { MembershipHistory } from "~context/domain/entities";

export const MembershipHistorySchema = new EntitySchema<MembershipHistory>({
    class: MembershipHistory,
    tableName: "membership_history",
    schema: "identity",

    indexes: [
        {
            name: "membership_history_account_idx",
            properties: ["account"],
        },
        {
            name: "membership_history_realm_idx",
            properties: ["realm"],
        },
        {
            name: "membership_history_account_realm_open_unique",
            expression:
                'CREATE UNIQUE INDEX "membership_history_account_realm_open_unique" ON "identity"."membership_history" ("account_id", "realm_id") WHERE "leave_at" IS NULL',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid", fieldName: "realm_id" },
        account: { type: "uuid", fieldName: "account_id" },

        invitedBy: { type: "uuid", fieldName: "invited_by" },
        excludedBy: { type: "uuid", fieldName: "excluded_by", nullable: true },

        joinedAt: { type: "timestamptz", length: 3 },
        leaveAt: { type: "timestamptz", length: 3, nullable: true },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
