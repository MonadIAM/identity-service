import { describe, it, expect } from "@jest/globals";

import { MembershipHistory } from "./membership-history.entity";

/* eslint-disable prettier/prettier */
const REALM_ID    = "a1b2c3d4-0000-0000-0000-000000000001";
const ACCOUNT_ID  = "a1b2c3d4-0000-0000-0000-000000000002";
const INVITER_ID  = "a1b2c3d4-0000-0000-0000-000000000003";
const EXCLUDER_ID = "a1b2c3d4-0000-0000-0000-000000000004";
/* eslint-enable prettier/prettier */

function createMembershipHistory(overrides?: Partial<Entities.MembershipHistory.ConstructorProps>): MembershipHistory {
    return new MembershipHistory({
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        invitedBy: INVITER_ID,
        account: ACCOUNT_ID,
        realm: REALM_ID,
        ...overrides,
    });
}

describe("MembershipHistory Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const joinedAt = new Date("2026-06-01T12:00:00.000Z");

            const history = createMembershipHistory({ joinedAt });

            expect(history.account).toBe(ACCOUNT_ID);
            expect(history.realm).toBe(REALM_ID);
            expect(history.invitedBy).toBe(INVITER_ID);
            expect(history.joinedAt).toBe(joinedAt);
        });

        it("should start as an open period", () => {
            const history = createMembershipHistory();

            expect(history.leaveAt).toBeUndefined();
            expect(history.excludedBy).toBeUndefined();
        });

        it("should set createdAt to current time", () => {
            const before = new Date();
            const history = createMembershipHistory();
            const after = new Date();

            expect(history.createdAt).toBeInstanceOf(Date);
            expect(history.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(history.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe("close", () => {
        it("should close an open period with the excluding actor", () => {
            const history = createMembershipHistory();
            history.close(EXCLUDER_ID);

            expect(history.excludedBy).toBe(EXCLUDER_ID);
            expect(history.leaveAt).toBeInstanceOf(Date);
        });

        it("should throw when the period is already closed", () => {
            const history = createMembershipHistory();
            history.close(EXCLUDER_ID);

            expect(() => history.close(EXCLUDER_ID)).toThrow("ALREADY_CLOSED");
        });

        it("should keep the original closing actor and timestamp after a rejected close", () => {
            const history = createMembershipHistory();
            history.close(EXCLUDER_ID);
            const { leaveAt } = history;

            expect(() => history.close(INVITER_ID)).toThrow("ALREADY_CLOSED");
            expect(history.excludedBy).toBe(EXCLUDER_ID);
            expect(history.leaveAt).toBe(leaveAt);
        });
    });
});
