import { describe, expect, it } from "@jest/globals";

import { SecondFactorCommandsUnitHelpers } from "~testing/unit/command-services/second-factor.helpers";
import { SecondFactorType } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new SecondFactorCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";
const ID = "entity-a";

describe("SecondFactorCommands", () => {
    describe("create", () => {
        it("persists the encrypted TOTP secret and builds the QR URI from plaintext", async () => {
            const { commands, secondFactorSecretService, secondFactorService, totpService, transaction } =
                await helpers.commands();
            totpService.createSecret.mockReturnValue("plain-secret");
            totpService.createURI.mockReturnValue("otpauth://unit");
            secondFactorSecretService.encrypt.mockResolvedValue("ciphertext");
            secondFactorService.create.mockResolvedValue(helpers.createSecondFactor({ id: ID }));

            const result = await commands.create({ input: { name: "Authenticator" }, actor: ACTOR, context: CONTEXT });

            expect(secondFactorSecretService.encrypt.mock.calls).toEqual([[{ secret: "plain-secret" }]]);
            expect(secondFactorService.create.mock.calls).toEqual([
                [
                    {
                        input: { name: "Authenticator", account: ACTOR, secret: "ciphertext", type: SecondFactorType.TOTP },
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
            expect(totpService.createURI.mock.calls).toEqual([[{ label: ACTOR, secret: "plain-secret" }]]);
            expect(result).toEqual({ id: ID, uri: "otpauth://unit" });
        });
    });

    describe("verify", () => {
        it.each([false, true])("discloses a new master code only if the account did not have one: %s", async (existing) => {
            const { commands, secondFactorService, cryptoService, hashingService, transaction } = await helpers.commands();
            const account = helpers.createAccount({ masterCode: existing ? helpers.createMasterCode() : undefined });
            secondFactorService.verify.mockResolvedValue(helpers.createSecondFactor({ account }));
            cryptoService.generateRecoveryCode.mockReturnValue("plain-code");
            hashingService.hash.mockResolvedValue("code-hash");

            const result = await commands.verify({ input: { factor: ID, code: "123456" }, actor: ACTOR, context: CONTEXT });

            expect(secondFactorService.verify.mock.calls).toEqual([
                [
                    {
                        input: { factor: ID, code: "123456", account: ACTOR, masterCodeHash: "code-hash" },
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
            expect(result.code).toBe(existing ? undefined : "plain-code");
        });
    });

    describe("reset", () => {
        it("resets factors using the recovery identity and publishes the resolved account", async () => {
            const { commands, secondFactorService, transaction, run } = await helpers.commands();
            secondFactorService.reset.mockResolvedValue(helpers.createAccount({ id: ACCOUNT }));
            const input = { identifier: "mail@example.test", code: "recovery-code" };

            await commands.reset({ input, context: CONTEXT });

            expect(secondFactorService.reset.mock.calls).toEqual([[{ input, transaction: transaction.entityManager }]]);
            await expect(run.mock.results[0]?.value).resolves.toEqual({ account: ACCOUNT });
        });
    });

    describe("purge", () => {
        it("binds factor removal to the authenticated account", async () => {
            const { commands, secondFactorService, transaction } = await helpers.commands();

            await commands.purge({ input: { factor: ID }, actor: ACTOR, context: CONTEXT });

            expect(secondFactorService.purge.mock.calls).toEqual([
                [{ input: { target: ID, account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });
});
