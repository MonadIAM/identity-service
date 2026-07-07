import { EntitySchema } from "@mikro-orm/core";

import { Application } from "~context/domain/entities";

export const ApplicationSchema = new EntitySchema<Application>({
    class: Application,
    tableName: "application",
    schema: "identity",

    uniques: [
        {
            name: "application_realm_name_unique",
            properties: ["realm", "name"],
        },
    ],

    indexes: [
        {
            name: "application_realm_idx",
            properties: ["realm"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid" },
        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },

        realmVersion: { type: "int" },
        isSystemManaged: { type: "boolean" },
        isRealmRevoked: { type: "boolean" },
        isRevoked: { type: "boolean" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
