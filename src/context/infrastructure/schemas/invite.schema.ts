import { EntitySchema } from "@mikro-orm/core";

import { InviteStatus } from "~context/enums";
import { Account, Invite } from "~context/domain/entities";

export const InviteSchema = new EntitySchema<Invite>({
    class: Invite,
    tableName: "invite",
    schema: "identity",

    indexes: [
        {
            name: "invite_invitee_idx",
            properties: ["invitee"],
        },
        {
            name: "invite_inviter_idx",
            properties: ["inviter"],
        },
        {
            name: "invite_realm_idx",
            properties: ["realm"],
        },
        {
            name: "invite_realm_invitee_pending_unique",
            expression:
                'CREATE UNIQUE INDEX "invite_realm_invitee_pending_unique" ON "identity"."invite" ("realm_id", "invitee_id") WHERE "status" = \'PENDING\'',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        status: { enum: true, items: () => InviteStatus, nativeEnumName: "invite_status" },

        invitee: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "invitee_id",
            deleteRule: "cascade",
        },
        inviter: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "inviter_id",
            deleteRule: "cascade",
        },

        realm: { type: "uuid", fieldName: "realm_id" },
        role: { type: "uuid", fieldName: "role_id" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
