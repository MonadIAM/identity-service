import { THROTTLER_LIMIT, THROTTLER_TTL } from "@nestjs/throttler/dist/throttler.constants";
import { describe, expect, it } from "@jest/globals";
import { Reflector } from "@nestjs/core";

import { SensitiveThrottle } from "./sensitive-throttle.decorator";

const reflector = new Reflector();
const cases = [
    { name: "OtpVerify", decorate: SensitiveThrottle.OtpVerify(), limit: 5, ttl: 600000 },
    { name: "OtpIssue", decorate: SensitiveThrottle.OtpIssue(), limit: 1, ttl: 60000 },
    { name: "TotpVerify", decorate: SensitiveThrottle.TotpVerify(), limit: 5, ttl: 300000 },
    { name: "HighImpactSecret", decorate: SensitiveThrottle.HighImpactSecret(), limit: 5, ttl: 3600000 },
    { name: "PasswordAuth", decorate: SensitiveThrottle.PasswordAuth(), limit: 10, ttl: 900000 },
];

describe("[Decorator] - SensitiveThrottle", () => {
    describe("[Behavior] - controller and handler limits", () => {
        it.each(cases)("[case] - $name configures both throttlers on a controller", ({ decorate, limit, ttl }) => {
            // Arrange
            @decorate
            class Controller {}
            class Unmarked {}

            // Act
            const limits = ["default", "account"].map((name) => ({
                limit: reflector.get(THROTTLER_LIMIT + name, Controller),
                ttl: reflector.get(THROTTLER_TTL + name, Controller),
                unmarkedLimit: reflector.get(THROTTLER_LIMIT + name, Unmarked),
                unmarkedTtl: reflector.get(THROTTLER_TTL + name, Unmarked),
            }));

            // Assert
            for (const actual of limits) {
                expect(actual.limit).toBe(limit);
                expect(actual.ttl).toBe(ttl);
                expect(actual.unmarkedLimit).toBeUndefined();
                expect(actual.unmarkedTtl).toBeUndefined();
            }
        });

        it.each(cases)("[case] - $name configures only the decorated method", ({ decorate, limit, ttl }) => {
            // Arrange
            class Controller {
                @decorate
                public sensitive(): void {}
                public ordinary(): void {}
            }

            // Act
            const limits = ["default", "account"].map((name) => ({
                limit: reflector.get(THROTTLER_LIMIT + name, Controller.prototype.sensitive),
                ttl: reflector.get(THROTTLER_TTL + name, Controller.prototype.sensitive),
                ordinaryLimit: reflector.get(THROTTLER_LIMIT + name, Controller.prototype.ordinary),
                controllerLimit: reflector.get(THROTTLER_LIMIT + name, Controller),
            }));

            // Assert
            for (const actual of limits) {
                expect(actual.limit).toBe(limit);
                expect(actual.ttl).toBe(ttl);
                expect(actual.ordinaryLimit).toBeUndefined();
                expect(actual.controllerLimit).toBeUndefined();
            }
        });

        it("[case] - lets method limits override controller limits for both throttlers", () => {
            // Arrange
            @SensitiveThrottle.PasswordAuth()
            class Controller {
                @SensitiveThrottle.OtpIssue()
                public issue(): void {}
                public inherited(): void {}
            }

            const methodTargets = [Controller.prototype.issue, Controller];
            const inheritedTargets = [Controller.prototype.inherited, Controller];

            // Act
            const limits = ["default", "account"].map((name) => ({
                methodLimit: reflector.getAllAndOverride(THROTTLER_LIMIT + name, methodTargets),
                methodTtl: reflector.getAllAndOverride(THROTTLER_TTL + name, methodTargets),
                inheritedLimit: reflector.getAllAndOverride(THROTTLER_LIMIT + name, inheritedTargets),
                inheritedTtl: reflector.getAllAndOverride(THROTTLER_TTL + name, inheritedTargets),
            }));

            // Assert
            for (const limit of limits) {
                expect(limit).toEqual({ methodLimit: 1, methodTtl: 60000, inheritedLimit: 10, inheritedTtl: 900000 });
            }
        });
    });
});
