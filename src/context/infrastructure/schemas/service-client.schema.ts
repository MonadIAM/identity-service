import { EntitySchema } from "@mikro-orm/core";

import { ServiceClient } from "~context/domain/entities";

export const ServiceClientSchema = new EntitySchema<ServiceClient>({
    class: ServiceClient,
    tableName: "service_client",
    schema: "identity",

    uniques: [
        {
            name: "service_client_realm_name_unique",
            properties: ["realm", "name"],
        },
        {
            name: "service_client_realm_code_unique",
            properties: ["realm", "code"],
        },
    ],

    indexes: [
        {
            name: "service_client_realm_idx",
            properties: ["realm"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid" },

        description: { type: "text", nullable: true },
        allowedAddresses: { type: "array" },
        code: { type: "text" },
        name: { type: "text" },

        isSystemManaged: { type: "boolean" },
        isRealmRevoked: { type: "boolean" },
        isRevoked: { type: "boolean" },
        realmVersion: { type: "int" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
