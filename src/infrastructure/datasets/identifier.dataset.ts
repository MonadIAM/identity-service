/* eslint-disable prettier/prettier */
import { ADMIN_ACCOUNT_ID, USER_ACCOUNT_ID } from "~context/constants";
import { IdentifierType } from "~context/enums";

const CREATED_AT  = new Date("2026-01-01T00:00:00.000Z");
const VERIFIED_AT = new Date("2026-01-01T00:00:00.000Z");

const dataset = [
    {
        id: "00000001-0000-4000-8000-100000000001",
        type: IdentifierType.EMAIL,
        value: "admin@example.com",
        provider_user_id: null,
        provider: null,
        is_public_contact: false,
        is_verified: true,
        account_id: ADMIN_ACCOUNT_ID,
        verified_at: VERIFIED_AT,
        created_at: CREATED_AT,
        last_used_at: null,
    },
    {
        id: "00000001-0000-4000-8000-100000000002",
        type: IdentifierType.EMAIL,
        value: "user@example.com",
        provider_user_id: null,
        provider: null,
        is_public_contact: false,
        is_verified: true,
        account_id: USER_ACCOUNT_ID,
        verified_at: VERIFIED_AT,
        created_at: CREATED_AT,
        last_used_at: null,
    },
];

export const Identifiers = {
    name: "identifier",
    postgresql: dataset,
};
