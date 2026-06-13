import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import { name, version } from "../../package.json";

const SWAGGER_TAGS: Record<string, string> = {
    /* eslint-disable prettier/prettier */
    Authn: "Primary authentication flows, including passwordless, password-based, and second-factor verification scenarios.",
    Account: "Account lifecycle management, including registration, verification, suspension, restoration, and self-service access.",
    Identifier: "Management of account identifiers such as email or phone, including verification and visibility preferences.",
    Profile: "Self-service profile updates for account-owned personal and presentation data.",
    Password: "Password credential management, including rotation and recovery through OTP or recovery code flows.",
    SecondFactor: "TOTP-based multi-factor authentication setup, verification, reset, and factor lifecycle management.",
    RecoveryCodes: "Backup recovery code management for second-factor fallback and emergency account access restoration.",
    JWKS: "Public JSON Web Key Set endpoint used by clients and gateways to validate issued JWT signatures.",
    AuditLog: "Centralized security log tracking operations, actors, and request context across authentication workflows.",
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
                customSiteTitle: "LIAM API",
                jsonDocumentUrl: "/docs-json",
                explorer: true,
                swaggerOptions: {
                    persistAuthorization: true,
                    docExpansion: "none",
                    filter: true,
                    initOAuth: {
                        useBasicAuthenticationWithAccessCodeGrant: false,
                        clientId: "web-dev",
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
