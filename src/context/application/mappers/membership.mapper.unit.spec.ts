import { describe, expect, it } from "@jest/globals";
import { isUUID } from "class-validator";

import { MembershipMapper } from "./membership.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID   = "00000000-0000-4000-8000-700000000001";
const REALM_ID   = "00000000-0000-4000-8000-700000000002";
const ACCOUNT_ID = "00000000-0000-4000-8000-700000000003";
/* eslint-enable prettier/prettier */

const mapper = new MembershipMapper();

describe("MembershipMapper", () => {
    describe("leaveRequestedPayload", () => {
        it("maps an exclusion request and generates a process identity", () => {
            const result = mapper.leaveRequestedPayload({
                input: { account: ACCOUNT_ID, reason: "access is no longer required" },
                actor: ACTOR_ID,
                realm: REALM_ID,
            });

            expect(result).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: {
                    account: ACCOUNT_ID,
                    reason: "access is no longer required",
                    command: "realm.exclude",
                    process: result.input.process,
                },
            });
            expect(isUUID(result.input.process, "4")).toBe(true);
        });
    });
});
