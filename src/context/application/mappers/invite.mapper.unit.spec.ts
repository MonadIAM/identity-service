import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";

import { InviteMapper } from "./invite.mapper";

/* eslint-disable prettier/prettier */
const INVITE_ID  = "00000000-0000-4000-8000-600000000001";
const INVITER_ID = "00000000-0000-4000-8000-600000000002";
const INVITEE_ID = "00000000-0000-4000-8000-600000000003";
const REALM_ID   = "00000000-0000-4000-8000-600000000004";
const ROLE_ID    = "00000000-0000-4000-8000-600000000005";
/* eslint-enable prettier/prettier */

const helpers = new EntityFactoryRegistry();
const mapper = new InviteMapper();

function createInvite(): Entities.Invite {
    return helpers.createInvite({
        inviter: helpers.createAccount({ id: INVITER_ID }),
        invitee: helpers.createAccount({ id: INVITEE_ID }),
        id: INVITE_ID,
        realm: REALM_ID,
        role: ROLE_ID,
    });
}

describe("InviteMapper", () => {
    describe("joinRequestedPayload", () => {
        it("maps the first invite to a membership request", () => {
            expect(mapper.joinRequestedPayload({ invites: [createInvite()] })).toEqual({
                actor: INVITER_ID,
                realm: REALM_ID,
                input: {
                    account: INVITEE_ID,
                    command: "invite.accept",
                    process: INVITE_ID,
                    invite: INVITE_ID,
                    role: ROLE_ID,
                },
            });
        });
    });

    describe("notificationPayload", () => {
        it("maps an invite notification with a stable deduplication key", () => {
            expect(mapper.notificationPayload({ invites: [createInvite()] })).toEqual({
                actor: INVITER_ID,
                realm: REALM_ID,
                input: {
                    params: { inviter: INVITER_ID, realm: REALM_ID },
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    template: MessageTemplate.INVITE_RECEIVED,
                    category: NotificationCategory.INVITES,
                    kind: NotificationContentKind.TEMPLATE,
                    dedupKey: `invite:${INVITE_ID}`,
                    recipient: INVITEE_ID,
                    language: "en",
                },
            });
        });
    });

    describe("notificationCancelPayload", () => {
        it("maps cancellation and its replacement notification", () => {
            expect(mapper.notificationCancelPayload({ invites: [createInvite()] })).toEqual({
                actor: INVITER_ID,
                realm: REALM_ID,
                input: {
                    dedupKey: `invite:${INVITE_ID}`,
                    override: {
                        actor: INVITER_ID,
                        realm: REALM_ID,
                        input: {
                            params: { inviter: INVITER_ID, realm: REALM_ID },
                            sourceService: PlatformService.IDENTITY_SERVICE,
                            template: MessageTemplate.INVITE_CANCELLED,
                            category: NotificationCategory.INVITES,
                            kind: NotificationContentKind.TEMPLATE,
                            recipient: INVITEE_ID,
                            language: "en",
                        },
                    },
                },
            });
        });
    });
});
