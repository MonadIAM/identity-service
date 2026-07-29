import { EntitySchema } from "@mikro-orm/core";

import { Account, Identifier } from "~context/domain/entities";
import { IdentifierType } from "~context/enums";

export const IdentifierSchema = new EntitySchema<Identifier>({
    class: Identifier,
    tableName: "identifier",
    schema: "identity",

    uniques: [
        {
            name: "identifier_type_value_unique",
            properties: ["type", "value"],
        },
        {
            name: "identifier_provider_provider_user_id_unique",
            properties: ["provider", "providerUserId"],
        },
    ],

    indexes: [
        {
            name: "identifier_value_trgm_idx",
            expression:
                'CREATE INDEX "identifier_value_trgm_idx" ON "identity"."identifier" USING gin ("value" gin_trgm_ops)',
        },
        {
            name: "identifier_account_id_idx",
            properties: ["account"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        type: { enum: true, items: () => IdentifierType },
        value: { type: "text" },

        provider: { type: "text", nullable: true },
        providerUserId: { type: "text", nullable: true },

        isVerified: { type: "boolean" },
        isPublicContact: { type: "boolean" },
        receiveNotifications: { type: "boolean" },

        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
        },

        verifiedAt: { type: "timestamptz", length: 3, nullable: true },
        lastUsedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
