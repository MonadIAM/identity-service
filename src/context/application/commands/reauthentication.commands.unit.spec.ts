import { describe, expect, it, jest, afterEach } from "@jest/globals";

import { ReauthenticationCommandsUnitHelpers } from "~testing/unit/command-services/reauthentication.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ReauthenticationCommandsUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("ReauthenticationCommands", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(["missing", "invalid"])("does not grant reauthentication for a %s password", async (state) => {
        const { commands, accountRepository, hashingService, emit } = helpers.commands();
        accountRepository.findUniqueOrThrow.mockResolvedValue(
            helpers.createAccount({ password: state === "missing" ? undefined : helpers.createPassword() }),
        );
        hashingService.verify.mockResolvedValue(false);

        await expect(
            commands.byPassword({ input: { password: "wrong" }, actor: ACTOR, session: ID, context: CONTEXT }),
        ).rejects.toThrow();

        expect(emit).not.toHaveBeenCalled();
    });

    it("grants password reauthentication only for the current session and configured TTL", async () => {
        const { commands, accountRepository, hashingService, emit } = helpers.commands();
        jest.spyOn(Date, "now").mockReturnValue(1000000);
        accountRepository.findUniqueOrThrow.mockResolvedValue(
            helpers.createAccount({ password: helpers.createPassword({ hash: "stored" }) }),
        );
        hashingService.verify.mockResolvedValue(true);

        await commands.byPassword({ input: { password: "plain" }, actor: ACTOR, session: ID, context: CONTEXT });

        expect(accountRepository.findUniqueOrThrow.mock.calls).toEqual([
            [{ options: { populate: ["password"] }, where: { id: ACTOR } }],
        ]);
        expect(hashingService.verify.mock.calls).toEqual([[{ value: "plain", storedHash: "stored" }]]);
        expect(emit.mock.calls).toEqual([[expect.objectContaining({ payload: { session: ID, expiresAt: 1300000 } })]]);
    });

    it("verifies the actor's second factor before preparing a session grant", async () => {
        const { commands, secondFactorService, run, transaction } = helpers.commands();
        jest.spyOn(Date, "now").mockReturnValue(1000000);

        await commands.bySecondFactor({ input: { code: "123456" }, actor: ACTOR, session: ID, context: CONTEXT });

        expect(secondFactorService.reauthenticate.mock.calls).toEqual([
            [{ input: { account: ACTOR, code: "123456" }, transaction: transaction.entityManager }],
        ]);
        await expect(run.mock.results[0]?.value).resolves.toEqual({ session: ID, expiresAt: 1300000 });
    });
});
