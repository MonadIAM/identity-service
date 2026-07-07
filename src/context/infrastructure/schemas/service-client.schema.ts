import { EntitySchema } from "@mikro-orm/core";

import { ServiceClient, Application } from "~context/domain/entities";

export const ServiceClientSchema = new EntitySchema<ServiceClient>({
    class: ServiceClient,
    tableName: "service_client",
    schema: "identity",

    uniques: [
        {
            name: "service_client_application_name_unique",
            properties: ["application", "name"],
        },
    ],

    indexes: [
        {
            name: "service_client_application_idx",
            properties: ["application"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        application: {
            kind: "m:1",
            entity: () => Application,
            deleteRule: "cascade",
        },

        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },
        clientSecretHash: { type: "text" },
        allowedAddresses: { type: "array" },

        applicationVersion: { type: "int" },
        isSystemManaged: { type: "boolean" },
        isApplicationRevoked: { type: "boolean" },
        isRevoked: { type: "boolean" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
