import { EntitySchema } from "@mikro-orm/core";

import { Notification, Account } from "~context/domain/entities";
import { NotificationCategory } from "~context/enums";

export const NotificationSchema = new EntitySchema<Notification>({
    class: Notification,
    tableName: "notification",
    schema: "identity",

    properties: {
        id: { primary: true, type: "uuid" },

        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
        },

        source: { type: "string", length: 64 },
        category: { enum: true, items: () => NotificationCategory },
        type: { type: "string", length: 128 },

        title: { type: "string", length: 255 },
        body: { type: "text" },

        readAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
