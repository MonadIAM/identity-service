import { EntitySchema } from "@mikro-orm/core";

import { OAuthClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";

export const OAuthClientSchema = new EntitySchema<OAuthClient>({
    class: OAuthClient,
    tableName: "oauth_client",
    schema: "identity",

    uniques: [
        {
            name: "oauth_client_realm_name_unique",
            properties: ["realm", "name"],
        },
    ],

    indexes: [
        {
            name: "oauth_client_realm_idx",
            properties: ["realm"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        realm: { type: "uuid" },
        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },
        redirectUri: { type: "text" },
        grantTypes: { enum: true, items: () => TokenGrantType, array: true },

        isRevoked: { type: "boolean" },
        isRealmRevoked: { type: "boolean" },
        realmVersion: { type: "int" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
