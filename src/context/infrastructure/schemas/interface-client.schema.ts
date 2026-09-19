import { EntitySchema } from "@mikro-orm/core";

import { InterfaceClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";

export const InterfaceClientSchema = new EntitySchema<InterfaceClient>({
    class: InterfaceClient,
    tableName: "interface_client",
    schema: "identity",

    uniques: [
        {
            name: "interface_client_realm_name_unique",
            properties: ["realm", "name"],
        },
    ],

    indexes: [
        {
            name: "interface_client_realm_idx",
            properties: ["realm"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid" },

        grantTypes: { type: "array", enum: true, items: () => TokenGrantType, array: true },
        description: { type: "text", nullable: true },
        redirectUris: { type: "array" },
        authAddress: { type: "text" },
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
