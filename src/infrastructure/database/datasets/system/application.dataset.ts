import { SYSTEM_REALM_ID } from "~context/constants";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const WEB_APPLICATION_ID = "00000004-0000-4000-8000-140000000001";

export const Applications = [
    {
        id: WEB_APPLICATION_ID,
        realm: SYSTEM_REALM_ID,
        name: "MonadIAM Web App",
        description: "Local development web application.",
        realm_version: 0,
        is_system_managed: true,
        is_realm_revoked: false,
        is_revoked: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
];
