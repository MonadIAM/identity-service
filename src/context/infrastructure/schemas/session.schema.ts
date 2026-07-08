import { EntitySchema } from "@mikro-orm/core";

import { Session, Account } from "~context/domain/entities";

export const SessionSchema = new EntitySchema<Session>({
    class: Session,
    tableName: "session",
    schema: "identity",

    properties: {
        id: { primary: true, type: "uuid" },

        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
        },

        realms: { type: "array", columnType: "text[]" },
        ip: { type: "text", columnType: "inet" },
        refreshTokenHash: { type: "text" },
        userAgent: { type: "text" },
        client: { type: "text" },

        expiresAt: { type: "timestamptz", length: 3 },
        createdAt: { type: "timestamptz", length: 3 },
        lastRefreshedAt: { type: "timestamptz", length: 3 },
    },
});
