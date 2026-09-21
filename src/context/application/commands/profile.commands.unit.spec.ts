import { describe, expect, it } from "@jest/globals";

import { ProfileCommandsUnitHelpers } from "~testing/unit/command-services/profile.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ProfileCommandsUnitHelpers();
const ACTOR = "actor-account";

describe("ProfileCommands", () => {
    it("updates the authenticated account's profile in a transaction", async () => {
        const { commands, profileService, transaction } = helpers.commands();
        const input = { displayName: "New name", timeZone: "Europe/Moscow" };

        await commands.update({ input, actor: ACTOR, context: CONTEXT });

        expect(profileService.update.mock.calls).toEqual([
            [{ input: { patch: input, account: ACTOR }, transaction: transaction.entityManager }],
        ]);
    });
});
