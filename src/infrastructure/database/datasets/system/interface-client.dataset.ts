import { TokenGrantType } from "~context/enums";

import { WEB_APPLICATION_ID } from "./application.dataset";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const WEB_INTERFACE_CLIENT_ID = "00000003-0000-4000-8000-130000000001";

export const InterfaceClients = [
    {
        id: WEB_INTERFACE_CLIENT_ID,
        application_id: WEB_APPLICATION_ID,
        name: "MonadIAM Web App",
        description: "Local development web client.",
        auth_address: "http://localhost:3000/auth/login",
        redirect_uri: "http://localhost:3000/main",
        grant_types: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
        application_version: 0,
        is_system_managed: true,
        is_application_revoked: false,
        is_revoked: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
];
