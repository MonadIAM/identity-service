import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { MembershipHistoryUnitHelpers } from "~testing/unit/domain-service/membership-history.helpers";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID  = "00000000-0000-4000-8000-300000000001";
const REALM_ID    = "00000000-0000-4000-8000-300000000002";
const INVITER_ID  = "00000000-0000-4000-8000-300000000003";
const EXCLUDER_ID = "00000000-0000-4000-8000-300000000004";
/* eslint-enable prettier/prettier */

const JOINED_AT = new Date("2026-01-01T00:00:00.000Z");

const helpers = new MembershipHistoryUnitHelpers();

describe("MembershipHistoryService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("opens a new history entry when the account has no open period in the realm", async () => {
            const { service, repositories, transaction } = helpers.service();

            await service.create({
                transaction: transaction.entityManager,
                input: {
                    invitedBy: INVITER_ID,
                    account: ACCOUNT_ID,
                    joinedAt: JOINED_AT,
                    realm: REALM_ID,
                },
            });

            expect(repositories.membershipHistories.findUnique).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, realm: REALM_ID, leaveAt: null },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({
                    invitedBy: INVITER_ID,
                    account: ACCOUNT_ID,
                    joinedAt: JOINED_AT,
                    realm: REALM_ID,
                }),
            );
        });

        it("persists nothing when an open history entry already exists", async () => {
            const existing = helpers.createMembershipHistory({ account: ACCOUNT_ID, realm: REALM_ID });
            const { service, repositories, transaction } = helpers.service();
            repositories.membershipHistories.findUnique.mockImplementation(() => Promise.resolve(existing));

            await service.create({
                transaction: transaction.entityManager,
                input: {
                    invitedBy: INVITER_ID,
                    account: ACCOUNT_ID,
                    joinedAt: JOINED_AT,
                    realm: REALM_ID,
                },
            });

            expect(transaction.persist).not.toHaveBeenCalled();
        });
    });

    describe("close", () => {
        it("closes the open history entry with the excluding actor", async () => {
            const existing = helpers.createMembershipHistory({ account: ACCOUNT_ID, realm: REALM_ID });
            const { service, repositories, transaction } = helpers.service();
            const closeSpy = jest.spyOn(existing, "close");
            repositories.membershipHistories.findUnique.mockImplementation(() => Promise.resolve(existing));

            await service.close({
                input: { account: ACCOUNT_ID, realm: REALM_ID, excludedBy: EXCLUDER_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.membershipHistories.findUnique).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, realm: REALM_ID, leaveAt: null },
                transaction: transaction.entityManager,
            });
            expect(closeSpy).toHaveBeenCalledWith(EXCLUDER_ID);
        });

        it("does nothing when there is no open history entry", async () => {
            const { service, transaction } = helpers.service();

            await service.close({
                input: { account: ACCOUNT_ID, realm: REALM_ID, excludedBy: EXCLUDER_ID },
                transaction: transaction.entityManager,
            });

            expect(transaction.persist).not.toHaveBeenCalled();
            expect(transaction.remove).not.toHaveBeenCalled();
        });
    });
});
