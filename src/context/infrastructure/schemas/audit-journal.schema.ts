import { EntitySchema } from "@mikro-orm/postgresql";

import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal } from "~context/domain/entities";

export const AuditJournalSchema = new EntitySchema<AuditJournal>({
    class: AuditJournal,
    tableName: "audit_journal",
    schema: "identity",

    indexes: [
        {
            name: "audit_journal_entity_idx",
            properties: ["entityType", "entity"],
        },
        {
            name: "audit_journal_by_at_idx",
            properties: ["by", "at"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        entity: { type: "uuid" },

        by: { type: "uuid", nullable: true },
        at: { type: "timestamptz", length: 3 },

        reason: { type: "text", nullable: true },
        patch: { type: "jsonb", nullable: true },

        ip: { type: "text", nullable: true },
        userAgent: { type: "text", nullable: true },

        actionType: { enum: true, items: () => IdentityActionType },
        entityType: { enum: true, items: () => IdentityEntityType },

        createdAt: { type: "timestamptz", length: 3 },
    },
});
