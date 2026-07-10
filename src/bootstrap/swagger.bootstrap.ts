import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import { Client } from "~context/enums";

import { name, version } from "../../package.json";

const SWAGGER_TAGS: Record<string, string> = {
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

export abstract class BootstrapSwagger {
    private constructor() {}

    public static registerSwagger(application: INestApplication): void {
        if (process.env.NODE_ENV === "development") {
            const description = readFileSync(join(__dirname, "./swagger.md"), "utf-8");

            const config = new DocumentBuilder()
                .setDescription(description)
                .setVersion(version)
                .setTitle(name)
                .addOAuth2(
                    {
                        type: "oauth2",
                        description: "Authenticate through identity-service",
                        flows: {
                            password: {
                                tokenUrl: `${process.env.IDENTITY_SERVICE_URL}/api/v1/authn/token/external`,
                                scopes: {},
                            },
                        },
                    },
                    "identity",
                )
                .addSecurityRequirements("identity");

            Object.entries(SWAGGER_TAGS).forEach(([name, description]) => {
                config.addTag(name, description);
            });

            const document = SwaggerModule.createDocument(application, config.build());

            SwaggerModule.setup("/docs", application, document, {
                customSiteTitle: "MonadIAM API",
                jsonDocumentUrl: "/docs-json",
                explorer: true,
                swaggerOptions: {
                    persistAuthorization: true,
                    docExpansion: "none",
                    filter: true,
                    initOAuth: {
                        useBasicAuthenticationWithAccessCodeGrant: false,
                        clientId: Client.WEB_DEV,
                        appName: name,
                    },
                    urls: [
                        {
                            url: `${process.env.ACCESS_CONTROL_SERVICE_URL}/docs-json`,
                            name: "AccessControl",
                        },
                        {
                            url: `${process.env.IDENTITY_SERVICE_URL}/docs-json`,
                            name: "Identity",
                        },
                    ],
                    "urls.primaryName": "Identity",
                },
            });
        }
    }
}
