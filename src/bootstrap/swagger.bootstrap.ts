import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import { name, version } from "../../package.json";

const SWAGGER_TAGS: Record<string, string> = {
    /* eslint-disable prettier/prettier */
    Auth: "Primary authentication flows, including passwordless, password-based, and second-factor verification scenarios.",
    Account: "Account lifecycle management, including registration, verification, suspension, restoration, and self-service access.",
    Session: "Session lifecycle and token rotation, including refresh, revocation, logout, and active session visibility.",
    Identifier: "Management of account identifiers such as email or phone, including verification and visibility preferences.",
    Profile: "Self-service profile updates for account-owned personal and presentation data.",
    Password: "Password credential management, including rotation and recovery through OTP or recovery code flows.",
    SecondFactor: "TOTP-based multi-factor authentication setup, verification, reset, and factor lifecycle management.",
    RecoveryCodes: "Backup recovery code management for second-factor fallback and emergency account access restoration.",
    ElevatedAccess: "Step-up identity confirmation for sensitive operations using password or second-factor verification.",
    OAuth: "External OAuth integration flows for provider authorization, callback handling, and federated account access.",
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

            const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version);

            Object.entries(SWAGGER_TAGS).forEach(([name, description]) => {
                config.addTag(name, description);
            });

            const document = SwaggerModule.createDocument(application, config.build());

            SwaggerModule.setup("/docs", application, document, {
                jsonDocumentUrl: "/docs-json",
                swaggerOptions: {
                    persistAuthorization: true,
                },
            });
        }
    }
}
