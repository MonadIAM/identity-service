import { THROTTLER_LIMIT, THROTTLER_TTL } from "@nestjs/throttler/dist/throttler.constants";
import { describe, expect, it } from "@jest/globals";
import { Reflector } from "@nestjs/core";

import { SensitiveThrottle } from "./sensitive-throttle.decorator";

const reflector = new Reflector();
const cases = [
    { name: "OtpVerify", decorate: SensitiveThrottle.OtpVerify(), limit: 5, ttl: 600000 },
    { name: "OtpIssue", decorate: SensitiveThrottle.OtpIssue(), limit: 3, ttl: 600000 },
    { name: "TotpVerify", decorate: SensitiveThrottle.TotpVerify(), limit: 5, ttl: 300000 },
    { name: "HighImpactSecret", decorate: SensitiveThrottle.HighImpactSecret(), limit: 5, ttl: 3600000 },
    { name: "PasswordAuth", decorate: SensitiveThrottle.PasswordAuth(), limit: 10, ttl: 900000 },
];

describe("SensitiveThrottle metadata", () => {
    it.each(cases)("$name configures both throttlers on a controller", ({ decorate, limit, ttl }) => {
        @decorate
        class Controller {}
        class Unmarked {}

        for (const name of ["default", "account"]) {
            expect(reflector.get(THROTTLER_LIMIT + name, Controller)).toBe(limit);
            expect(reflector.get(THROTTLER_TTL + name, Controller)).toBe(ttl);
            expect(reflector.get(THROTTLER_LIMIT + name, Unmarked)).toBeUndefined();
            expect(reflector.get(THROTTLER_TTL + name, Unmarked)).toBeUndefined();
        }
    });

    it.each(cases)("$name configures only the decorated method", ({ decorate, limit, ttl }) => {
        class Controller {
            @decorate
            public sensitive(): void {}
            public ordinary(): void {}
        }

        for (const name of ["default", "account"]) {
            expect(reflector.get(THROTTLER_LIMIT + name, Controller.prototype.sensitive)).toBe(limit);
            expect(reflector.get(THROTTLER_TTL + name, Controller.prototype.sensitive)).toBe(ttl);
            expect(reflector.get(THROTTLER_LIMIT + name, Controller.prototype.ordinary)).toBeUndefined();
            expect(reflector.get(THROTTLER_LIMIT + name, Controller)).toBeUndefined();
        }
    });

    it("lets method limits override controller limits for both throttlers", () => {
        @SensitiveThrottle.PasswordAuth()
        class Controller {
            @SensitiveThrottle.OtpIssue()
            public issue(): void {}
            public inherited(): void {}
        }

        for (const name of ["default", "account"]) {
            const methodTargets = [Controller.prototype.issue, Controller];
            const inheritedTargets = [Controller.prototype.inherited, Controller];

            expect(reflector.getAllAndOverride(THROTTLER_LIMIT + name, methodTargets)).toBe(3);
            expect(reflector.getAllAndOverride(THROTTLER_TTL + name, methodTargets)).toBe(600000);
            expect(reflector.getAllAndOverride(THROTTLER_LIMIT + name, inheritedTargets)).toBe(10);
            expect(reflector.getAllAndOverride(THROTTLER_TTL + name, inheritedTargets)).toBe(900000);
        }
    });
});
