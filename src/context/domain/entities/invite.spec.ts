import { describe, it, expect } from "@jest/globals";

import { InviteStatus } from "~context/enums";

import { Account } from "./account.entity";
import { Invite } from "./invite.entity";

/* eslint-disable prettier/prettier */
const REALM_ID = "a1b2c3d4-0000-0000-0000-000000000001";
const ROLE_ID  = "a1b2c3d4-0000-0000-0000-000000000002";
/* eslint-enable prettier/prettier */

function createInvite(overrides?: Partial<Entities.Invite.ConstructorProps>): Invite {
    return new Invite({
        invitee: {} as Account,
        inviter: {} as Account,
        realm: REALM_ID,
        role: ROLE_ID,
        ...overrides,
    });
}

describe("Invite Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const invitee = {} as Account;
            const inviter = {} as Account;

            const invite = createInvite({ invitee, inviter });

            expect(invite.invitee).toBe(invitee);
            expect(invite.inviter).toBe(inviter);
            expect(invite.realm).toBe(REALM_ID);
            expect(invite.role).toBe(ROLE_ID);
        });

        it("should start as pending and unmodified", () => {
            const invite = createInvite();

            expect(invite.status).toBe(InviteStatus.PENDING);
            expect(invite.updatedAt).toBeUndefined();
            expect(invite.version).toBe(1);
        });

        it("should set createdAt to current time", () => {
            const before = new Date();
            const invite = createInvite();
            const after = new Date();

            expect(invite.createdAt).toBeInstanceOf(Date);
            expect(invite.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(invite.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe("cancel", () => {
        it("should cancel a pending invite", () => {
            const invite = createInvite();
            invite.cancel();

            expect(invite.status).toBe(InviteStatus.CANCELLED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is already cancelled", () => {
            const invite = createInvite();
            invite.status = InviteStatus.CANCELLED;

            expect(() => invite.cancel()).toThrow("CANNOT_CANCEL_INACTIVE");
        });
    });

    describe("accept", () => {
        it("should accept a pending invite", () => {
            const invite = createInvite();
            invite.accept();

            expect(invite.status).toBe(InviteStatus.ACCEPTED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is already accepted", () => {
            const invite = createInvite();
            invite.status = InviteStatus.ACCEPTED;

            expect(() => invite.accept()).toThrow("CANNOT_ACCEPT_INACTIVE");
        });
    });

    describe("decline", () => {
        it("should decline a pending invite", () => {
            const invite = createInvite();
            invite.decline();

            expect(invite.status).toBe(InviteStatus.DECLINED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is already declined", () => {
            const invite = createInvite();
            invite.status = InviteStatus.DECLINED;

            expect(() => invite.decline()).toThrow("CANNOT_DECLINE_INACTIVE");
        });
    });

    describe("invalidate", () => {
        it("should invalidate a pending invite", () => {
            const invite = createInvite();
            invite.invalidate();

            expect(invite.status).toBe(InviteStatus.INVALIDATED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is already invalidated", () => {
            const invite = createInvite();
            invite.status = InviteStatus.INVALIDATED;

            expect(() => invite.invalidate()).toThrow("CANNOT_INVALIDATE_INACTIVE");
        });
    });

    describe("expire", () => {
        it("should expire a pending invite", () => {
            const invite = createInvite();
            invite.expire();

            expect(invite.status).toBe(InviteStatus.EXPIRED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is already expired", () => {
            const invite = createInvite();
            invite.status = InviteStatus.EXPIRED;

            expect(() => invite.expire()).toThrow("CANNOT_EXPIRE_INACTIVE");
        });
    });

    describe("terminal statuses", () => {
        it("should reject every transition once the invite left the pending state", () => {
            const invite = createInvite();
            invite.accept();

            expect(() => invite.cancel()).toThrow("CANNOT_CANCEL_INACTIVE");
            expect(() => invite.decline()).toThrow("CANNOT_DECLINE_INACTIVE");
            expect(() => invite.invalidate()).toThrow("CANNOT_INVALIDATE_INACTIVE");
            expect(() => invite.expire()).toThrow("CANNOT_EXPIRE_INACTIVE");
            expect(invite.status).toBe(InviteStatus.ACCEPTED);
        });
    });
});
