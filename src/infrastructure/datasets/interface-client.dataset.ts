import { TokenGrantType } from "~context/enums";

import { DOCS_APPLICATION_ID, WEB_APPLICATION_ID } from "./application.dataset";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const GRANT_TYPES = `{${TokenGrantType.AUTHORIZATION_CODE},${TokenGrantType.REFRESH_TOKEN}}`;
const WEB_AUTH_ADDRESS = "http://localhost:3000/auth/login";
const IDENTITY_PORT = 4002;

const DOCS_ROUTE = "/docs/";
const DOCS_PORTS = [4000, 4001, IDENTITY_PORT, 4003];
const DOCS_AUTH_ANCHOR = "#identity/tag/authn/POST/api/v1/authn/password";
const DOCS_AUTH_ADDRESS = `http://localhost:${IDENTITY_PORT}${DOCS_ROUTE}${DOCS_AUTH_ANCHOR}`;
const DOCS_REDIRECT_URIS = `{${DOCS_PORTS.map((port) => `http://localhost:${port}${DOCS_ROUTE}`).join(",")}}`;

export const WEB_INTERFACE_CLIENT_ID = "00000003-0000-4000-8000-130000000001";
export const DOCS_INTERFACE_CLIENT_ID = "00000003-0000-4000-8000-130000000002";

const dataset = [
    {
        id: WEB_INTERFACE_CLIENT_ID,
        application_id: WEB_APPLICATION_ID,
        name: "MonadIAM Web App",
        description: "Local development web client.",
        auth_address: WEB_AUTH_ADDRESS,
        redirect_uris: "{http://localhost:3000/main}",
        grant_types: GRANT_TYPES,
        application_version: 0,
        is_system_managed: true,
        is_application_revoked: false,
        is_revoked: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
    {
        id: DOCS_INTERFACE_CLIENT_ID,
        application_id: DOCS_APPLICATION_ID,
        name: "MonadIAM API Docs",
        description: "API reference client shared by the per-service Scalar pages.",
        auth_address: DOCS_AUTH_ADDRESS,
        redirect_uris: DOCS_REDIRECT_URIS,
        grant_types: GRANT_TYPES,
        application_version: 0,
        is_system_managed: true,
        is_application_revoked: false,
        is_revoked: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
];

export const InterfaceClients = {
    name: "interface_client",
    postgresql: dataset,
};
