import { EntitySchema } from "@mikro-orm/core";

import { InterfaceClient, ServiceClient, Application } from "~context/domain/entities";

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

        interfaceClients: {
            kind: "1:m",
            entity: () => InterfaceClient,
            mappedBy: "application",
        },

        serviceClients: {
            kind: "1:m",
            entity: () => ServiceClient,
            mappedBy: "application",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
