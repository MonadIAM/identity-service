import { EntitySchema } from "@mikro-orm/core";

import { InterfaceClient, Application } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";

export const InterfaceClientSchema = new EntitySchema<InterfaceClient>({
    class: InterfaceClient,
    tableName: "interface_client",
    schema: "identity",

    uniques: [
        {
            name: "interface_client_application_name_unique",
            properties: ["application", "name"],
        },
    ],

    indexes: [
        {
            name: "interface_client_application_idx",
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
        redirectUri: { type: "text" },
        authAddress: { type: "text" },
        grantTypes: { type: "array", enum: true, items: () => TokenGrantType, array: true },

        applicationVersion: { type: "int" },
        isSystemManaged: { type: "boolean" },
        isApplicationRevoked: { type: "boolean" },
        isRevoked: { type: "boolean" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
