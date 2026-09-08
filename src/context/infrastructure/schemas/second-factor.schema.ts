import { BigIntType, EntitySchema } from "@mikro-orm/core";

import { SecondFactor, Account } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

export const SecondFactorSchema = new EntitySchema<SecondFactor>({
    class: SecondFactor,
    tableName: "second_factor",
    schema: "identity",

    uniques: [
        {
            name: "second_factor_account_type_unique",
            properties: ["account", "type"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        account: {
            kind: "m:1",
            entity: () => Account,
            fieldName: "account_id",
            deleteRule: "cascade",
        },

        type: { enum: true, items: () => SecondFactorType, nativeEnumName: "second_factor_type" },
        secret: { type: "text" },
        name: { type: "text", nullable: true },

        lastAcceptedTOTPStep: { type: new BigIntType("number"), fieldName: "last_accepted_totp_step", nullable: true },
        confirmedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
    },
});
