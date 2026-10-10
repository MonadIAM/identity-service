import { describe, expect, it } from "@jest/globals";

import { SecondFactorCommandsUnitHelpers } from "~testing/unit/command-services/second-factor.helpers";
import { SecondFactorType } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new SecondFactorCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";
const ID = "entity-a";

describe("[Commands] - SecondFactor", () => {
    describe("[Method] - create", () => {
        it("[case] - persists the encrypted TOTP secret and builds the QR URI from plaintext", async () => {
            // Arrange
            const { commands, secondFactorSecretService, secondFactorService, totpService, transaction } =
                await helpers.commands();
            totpService.createSecret.mockReturnValue("plain-secret");
            totpService.createURI.mockReturnValue("otpauth://unit");
            secondFactorSecretService.encrypt.mockResolvedValue("ciphertext");
            secondFactorService.create.mockResolvedValue(helpers.createSecondFactor({ id: ID }));

            // Act
            const result = await commands.create({ input: { name: "Authenticator" }, actor: ACTOR, context: CONTEXT });

            // Assert
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

    describe("[Method] - verify", () => {
        it.each([false, true])(
            "[case] - discloses a new master code only if the account did not have one: %s",
            async (existing) => {
                // Arrange
                const { commands, secondFactorService, cryptoService, hashingService, transaction } =
                    await helpers.commands();
                const account = helpers.createAccount({ masterCode: existing ? helpers.createMasterCode() : undefined });
                secondFactorService.verify.mockResolvedValue(helpers.createSecondFactor({ account }));
                cryptoService.generateRecoveryCode.mockReturnValue("plain-code");
                hashingService.hash.mockResolvedValue("code-hash");

                // Act
                const result = await commands.verify({
                    input: { factor: ID, code: "123456" },
                    actor: ACTOR,
                    context: CONTEXT,
                });

                // Assert
                expect(secondFactorService.verify.mock.calls).toEqual([
                    [
                        {
                            input: { factor: ID, code: "123456", account: ACTOR, masterCodeHash: "code-hash" },
                            transaction: transaction.entityManager,
                        },
                    ],
                ]);
                expect(result.code).toBe(existing ? undefined : "plain-code");
            },
        );
    });

    describe("[Method] - reset", () => {
        it("[case] - resets factors using the recovery identity and publishes the resolved account", async () => {
            // Arrange
            const { commands, secondFactorService, transaction, run } = await helpers.commands();
            secondFactorService.reset.mockResolvedValue(helpers.createAccount({ id: ACCOUNT }));
            const input = { identifier: "mail@example.test", code: "recovery-code" };

            // Act
            await commands.reset({ input, context: CONTEXT });
            const result = await run.mock.results[0]?.value;

            // Assert
            expect(secondFactorService.reset.mock.calls).toEqual([[{ input, transaction: transaction.entityManager }]]);
            expect(result).toEqual({ account: ACCOUNT });
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - binds factor removal to the authenticated account", async () => {
            // Arrange
            const { commands, secondFactorService, transaction } = await helpers.commands();

            // Act
            await commands.purge({ input: { factor: ID }, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(secondFactorService.purge.mock.calls).toEqual([
                [{ input: { target: ID, account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });
});
