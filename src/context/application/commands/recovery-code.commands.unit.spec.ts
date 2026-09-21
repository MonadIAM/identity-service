import { describe, expect, it } from "@jest/globals";

import { RecoveryCodeCommandsUnitHelpers } from "~testing/unit/command-services/recovery-code.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RecoveryCodeCommandsUnitHelpers();
const ACTOR = "actor-account";

describe("RecoveryCodeCommands", () => {
    it("returns plaintext codes while persisting only their hashes for the actor", async () => {
        const { commands, recoveryCodeService, cryptoService, hashingService, transaction } = helpers.commands();
        cryptoService.generateRecoveryCodes.mockReturnValue(["code-one", "code-two"]);
        hashingService.hash.mockImplementation(({ value }) => Promise.resolve(`hash:${value}`));

        const result = await commands.regenerate({ actor: ACTOR, context: CONTEXT });

        expect(result.codes).toEqual(["code-one", "code-two"]);
        expect(recoveryCodeService.regenerate.mock.calls).toEqual([
            [
                {
                    input: { account: ACTOR, hashes: ["hash:code-one", "hash:code-two"] },
                    transaction: transaction.entityManager,
                },
            ],
        ]);
    });

    it("does not replace recovery codes if hashing fails", async () => {
        const { commands, recoveryCodeService, cryptoService, hashingService, run } = helpers.commands();
        cryptoService.generateRecoveryCodes.mockReturnValue(["code"]);
        const failure = new Error("hash failure");
        hashingService.hash.mockRejectedValue(failure);

        await expect(commands.regenerate({ actor: ACTOR, context: CONTEXT })).rejects.toBe(failure);

        expect(run).not.toHaveBeenCalled();
        expect(recoveryCodeService.regenerate).not.toHaveBeenCalled();
    });
});
