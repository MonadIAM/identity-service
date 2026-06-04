import { describe, it, expect } from "@jest/globals";

import { Membership } from "./membership.entity";
import { Account } from "./account.entity";

function createMembership(overrides?: Partial<Entities.Membership.ConstructorProps>): Membership {
    return new Membership({
        invitedBy: "a1b2c3d4-0000-0000-0000-000000000002",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        realm: "a1b2c3d4-0000-0000-0000-000000000001",
        account: {} as Account,
        ...overrides,
    });
}

describe("Membership Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;
            const joinedAt = new Date("2026-06-01T12:00:00.000Z");

            const membership = createMembership({ account, joinedAt });

            expect(membership.account).toBe(account);
            expect(membership.realm).toBe("a1b2c3d4-0000-0000-0000-000000000001");
            expect(membership.joinedAt).toBe(joinedAt);
            expect(membership.invitedBy).toBe("a1b2c3d4-0000-0000-0000-000000000002");
        });

        it("should set createdAt to current time", () => {
            const before = new Date();
            const membership = createMembership();
            const after = new Date();

            expect(membership.createdAt).toBeInstanceOf(Date);
            expect(membership.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(membership.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });
});
