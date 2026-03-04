import { EntitySchema } from "@mikro-orm/core";

import { Profile, Account } from "~context/domain/entities";

export const ProfileSchema = new EntitySchema<Profile>({
    class: Profile,
    tableName: "profile",
    schema: "identity",

    properties: {
        account: {
            kind: "1:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
            primary: true,
            owner: true,
        },

        displayName: { type: "string", length: 255 },
        locale: { type: "string", length: 16, nullable: true },
        timeZone: { type: "string", length: 64, nullable: true },
        pictureUrl: { type: "text", nullable: true },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
    },
});
