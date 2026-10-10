import { describe, expect, it, jest, afterEach } from "@jest/globals";

import { ReauthenticationCommandsUnitHelpers } from "~testing/unit/command-services/reauthentication.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ReauthenticationCommandsUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("[Commands] - Reauthentication", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - byPassword", () => {
        it.each(["missing", "invalid"])("[case] - does not grant reauthentication for a %s password", async (state) => {
            // Arrange
            const { commands, accountRepository, hashingService, emit } = helpers.commands();
            accountRepository.findUniqueOrThrow.mockResolvedValue(
                helpers.createAccount({ password: state === "missing" ? undefined : helpers.createPassword() }),
            );
            hashingService.verify.mockResolvedValue(false);

            // Act
            const result = commands.byPassword({
                input: { password: "wrong" },
                actor: ACTOR,
                session: ID,
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toThrow();
            expect(emit).not.toHaveBeenCalled();
        });

        it("[case] - grants password reauthentication only for the current session and configured TTL", async () => {
            // Arrange
            const { commands, accountRepository, hashingService, emit } = helpers.commands();
            jest.spyOn(Date, "now").mockReturnValue(1000000);
            accountRepository.findUniqueOrThrow.mockResolvedValue(
                helpers.createAccount({ password: helpers.createPassword({ hash: "stored" }) }),
            );
            hashingService.verify.mockResolvedValue(true);

            // Act
            await commands.byPassword({ input: { password: "plain" }, actor: ACTOR, session: ID, context: CONTEXT });

            // Assert
            expect(accountRepository.findUniqueOrThrow.mock.calls).toEqual([
                [{ options: { populate: ["password"] }, where: { id: ACTOR } }],
            ]);
            expect(hashingService.verify.mock.calls).toEqual([[{ value: "plain", storedHash: "stored" }]]);
            expect(emit.mock.calls).toEqual([[expect.objectContaining({ payload: { session: ID, expiresAt: 1300000 } })]]);
        });
    });

    describe("[Method] - bySecondFactor", () => {
        it("[case] - verifies the actor's second factor before preparing a session grant", async () => {
            // Arrange
            const { commands, secondFactorService, run, transaction } = helpers.commands();
            jest.spyOn(Date, "now").mockReturnValue(1000000);

            // Act
            await commands.bySecondFactor({ input: { code: "123456" }, actor: ACTOR, session: ID, context: CONTEXT });
            const result = await run.mock.results[0]?.value;

            // Assert
            expect(secondFactorService.reauthenticate.mock.calls).toEqual([
                [{ input: { account: ACTOR, code: "123456" }, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual({ session: ID, expiresAt: 1300000 });
        });
    });
});
