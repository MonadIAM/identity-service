import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AuditLog } from "./audit-log.entity";

const BASE_CONTEXT: Extract.Meta = {
    userAgent: "Mozilla/5.0",
    ip: "127.0.0.1",
};

function createAuditLog(overrides?: Partial<SystemEntities.AuditLog.ConstructorProps>): AuditLog {
    return new AuditLog({
        actionType: "SIGN_UP_ACCOUNT",
        entityType: "ACCOUNT",
        context: BASE_CONTEXT,
        ...overrides,
    });
}

describe("[Entity] - AuditLog", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.actionType).toBe("SIGN_UP_ACCOUNT");
            expect(log.entityType).toBe("ACCOUNT");
        });

        it("[case] - auto-generates id and createdAt", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            const result = isUUID(log.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(log.createdAt).toBeInstanceOf(Date);
        });

        it("[case] - assigns ip and userAgent from context", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.ip).toBe(BASE_CONTEXT.ip);
            expect(log.userAgent).toBe(BASE_CONTEXT.userAgent);
        });

        it("[case] - assigns optional actor when provided", () => {
            // Arrange

            // Act
            const log = createAuditLog({ actor: "00000000-0000-4000-8000-000000000001" });

            // Assert
            expect(log.actor).toBe("00000000-0000-4000-8000-000000000001");
        });

        it("[case] - leaves actor undefined when omitted", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.actor).toBeUndefined();
        });

        it("[case] - assigns optional input when provided", () => {
            // Arrange
            const input = { email: "user@example.com" };

            // Act
            const log = createAuditLog({ input });

            // Assert
            expect(log.input).toBe(input);
        });

        it("[case] - leaves input undefined when omitted", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.input).toBeUndefined();
        });
    });
});
