import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import apiReference from "@scalar/fastify-api-reference";
import { readFileSync } from "fs";
import { join } from "path";

import { name, version } from "~root/package.json";
import { OidcScope } from "~context/enums";
import { NodeEnv } from "~common/enums";

import { ReferenceAutomation } from "./automation";

const PAGE_TITLE = "MonadIAM | API Docs";
const SECURITY_SCHEME = "identity";
const DOCUMENT_SLUG = "identity";
const DOCUMENT_ROUTE = "/openapi.json";
const REFERENCE_ROUTE = "/docs";

const REFERENCE_TAGS: Record<string, string> = {
    /* eslint-disable prettier/prettier */
    Discovery: "OAuth 2.0/OpenID Connect server metadata (RFC 8414, OIDC Discovery 1.0) and the JWKS (RFC 7517) used to verify issued tokens.",
    OAuth: "OAuth 2.0 Authorization Framework (RFC 6749) endpoints for authorization, token issuance, and revocation, designed per current security best practices (RFC 9700).",
    Application: "Lifecycle management of applications: the realm-scoped container grouping interface and service clients.",
    InterfaceClient: "Lifecycle management of interactive OAuth clients used in the authorization code flow: creation, updates, revocation, restoration, and permanent deletion.",
    ServiceClient: "Lifecycle management of machine-to-machine OAuth clients used in the client credentials flow, including secret regeneration.",
    Authn: "Authentication, step-up reauthentication, and session lifecycle: password, OTP, and TOTP verification, plus session listing and sign-out.",
    FederatedAuthn: "Federated authentication through external OpenID Connect providers (OpenID Connect Core 1.0).",
    Account: "Account lifecycle management, including registration, verification, suspension, restoration, and self-service access.",
    Identifier: "Management of account identifiers such as email or phone: creation, verification, and notification/visibility preferences.",
    Profile: "Self-service profile updates for account-owned personal and presentation data.",
    Password: "Password credential management, including rotation and recovery through OTP or recovery code flows.",
    SecondFactor: "TOTP-based second-factor authentication setup, verification, reset, and factor lifecycle management.",
    RecoveryCodes: "One-time backup codes issued at account verification, used to reset a password when other credentials are unavailable.",
    AuditLog: "Centralized security log tracking operations, actors, and request context across the service.",
    ChangeLog: "Field-level change history linked to audit entries, capturing before/after deltas for entity mutations.",
    Health: "Service observability probes exposing liveness status and infrastructure readiness across dependent subsystems.",
    /* eslint-enable prettier/prettier */
};

const SCOPE_DESCRIPTIONS: Record<OidcScope, string> = {
    [OidcScope.PROFILE]: "Read profile claims: name, picture, locale, and time zone.",
    [OidcScope.OPENID]: "Issue an ID token and allow the UserInfo endpoint.",
    [OidcScope.EMAIL]: "Read the email claim and its verification state.",
};

export abstract class BootstrapReference {
    private constructor() {}

    public static async registerReference(application: NestFastifyApplication): Promise<void> {
        if (process.env.NODE_ENV === NodeEnv.LOCAL) {
            const description = readFileSync(join(__dirname, "../../assets/description.md"), "utf-8");
            const favicon = readFileSync(join(__dirname, "../../assets/favicon.svg"), "utf-8");

            const config = new DocumentBuilder()
                .setDescription(description)
                .setVersion(version)
                .setTitle(name)
                .addOAuth2(this.securityScheme(), SECURITY_SCHEME)
                .addSecurityRequirements(SECURITY_SCHEME);

            Object.entries(REFERENCE_TAGS).forEach(([name, description]) => {
                config.addTag(name, description);
            });

            const document = SwaggerModule.createDocument(application, config.build());

            this.publishDocument(application, document);

            await application.register(apiReference, {
                routePrefix: REFERENCE_ROUTE,
                configuration: {
                    customFetch: ReferenceAutomation.customFetch,
                    favicon: `data:image/svg+xml;base64,${Buffer.from(favicon).toString("base64")}`,
                    showDeveloperTools: "never",
                    pageTitle: PAGE_TITLE,
                    proxyUrl: "",
                    sources: this.sources(document),
                    agent: { disabled: true },
                    mcp: { disabled: true },
                    withDefaultFonts: false,
                    hideClientButton: true,
                    persistAuth: true,
                },
            });
        }
    }

    private static publishDocument(application: NestFastifyApplication, document: object): void {
        application
            .getHttpAdapter()
            .getInstance()
            .route({
                method: "GET",
                url: `${REFERENCE_ROUTE}${DOCUMENT_ROUTE}`,
                handler: (_request, reply) => reply.send(document),
            });
    }

    private static sources(document: object): Bootstrap.Reference.Source[] {
        return [
            { slug: "access-control", title: "AccessControl", origin: process.env.ACCESS_CONTROL_SERVICE_URL },
            { slug: "notification", title: "Notification", origin: process.env.NOTIFICATION_SERVICE_URL },
            { slug: "identity", title: "Identity", origin: process.env.IDENTITY_SERVICE_URL },
            { slug: "template", title: "Template", origin: process.env.TEMPLATE_SERVICE_URL },
        ].map(({ slug, title, origin }) =>
            slug === DOCUMENT_SLUG
                ? { content: document, title, slug, default: true }
                : { url: `${origin}${REFERENCE_ROUTE}${DOCUMENT_ROUTE}`, title, slug },
        );
    }

    private static securityScheme(): Bootstrap.Reference.SecurityScheme {
        const apiBaseUrl = `${process.env.IDENTITY_SERVICE_URL}/api/v${process.env.API_VERSION}`;
        return {
            type: "oauth2",
            description: "Authenticate through identity-service.",
            "x-default-scopes": [OidcScope.OPENID, OidcScope.PROFILE, OidcScope.EMAIL],
            flows: {
                authorizationCode: {
                    "x-scalar-client-id": process.env.DOCS_OAUTH_CLIENT_ID,
                    "x-usePkce": "SHA-256",
                    authorizationUrl: `${apiBaseUrl}/oauth/authorize`,
                    refreshUrl: `${apiBaseUrl}/oauth/token`,
                    tokenUrl: `${apiBaseUrl}/oauth/token`,
                    scopes: SCOPE_DESCRIPTIONS,
                },
            },
        };
    }
}
