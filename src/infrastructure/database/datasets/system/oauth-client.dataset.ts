import { TokenGrantType } from "~context/enums";

const SYSTEM_REALM_ID = "00000001-0000-4000-8000-100000000001";
const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const WEB_OAUTH_CLIENT_ID = "00000003-0000-4000-8000-130000000001";

export const OAuthClients = [
    {
        id: WEB_OAUTH_CLIENT_ID,
        realm: SYSTEM_REALM_ID,
        name: "LIAM Web App",
        description: "Local development web client.",
        redirect_uri: "http://localhost:3000/auth/callback",
        grant_types: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
        realm_version: 0,
        is_system_managed: true,
        is_realm_revoked: false,
        is_revoked: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
];
