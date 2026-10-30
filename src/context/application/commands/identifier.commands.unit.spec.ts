import { describe, expect, it } from "@jest/globals";

import { IdentifierCommandsUnitHelpers } from "~testing/unit/command-services/identifier.helpers";
import { IdentifierType } from "~context/enums";

const ACTOR = "actor-account";
const ID = "entity-a";
const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new IdentifierCommandsUnitHelpers();

describe("[Commands] - Identifier", () => {
    describe("[Method] - create", () => {
        it("[case] - creates an actor-owned identifier and binds its verification code to the resulting identifier", async () => {
            // Arrange
            const { commands, identifierService, cryptoService, otpCacheService, transaction } = await helpers.commands();
            cryptoService.generateOTP.mockReturnValue("123456");
            identifierService.create.mockResolvedValue(helpers.createIdentifier({ id: ID }));

            // Act
            await commands.create({
                input: { identifier: "mail@example.test", type: IdentifierType.EMAIL },
                actor: ACTOR,
                context: CONTEXT,
            });

            // Assert
            expect(identifierService.create.mock.calls).toEqual([
                [
                    {
                        input: {
                            account: ACTOR,
                            identifier: { identity: "mail@example.test", type: IdentifierType.EMAIL },
                        },
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
            expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "identifier", value: ID, key: "123456" }]]);
        });
    });

    describe("[Method] - resend", () => {
        it.each([false, true])(
            "[case] - resends only an unverified identifier owned by the actor: %s",
            async (isVerified) => {
                // Arrange
                const { commands, identifierRepository, otpCacheService, cryptoService, emit } = await helpers.commands();
                identifierRepository.findUniqueOrThrow.mockResolvedValue(helpers.createIdentifier({ id: ID, isVerified }));
                cryptoService.generateOTP.mockReturnValue("123456");

                // Act
                const result = commands.resend({
                    input: { identifier: "mail@example.test" },
                    actor: ACTOR,
                    context: CONTEXT,
                });
                if (isVerified) {
                    await Promise.allSettled([result]);
                } else {
                    await result;
                }

                // Assert
                if (isVerified) {
                    await expect(result).rejects.toThrow();
                    expect(otpCacheService.set).not.toHaveBeenCalled();
                    expect(emit).not.toHaveBeenCalled();
                } else {
                    expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "identifier", value: ID, key: "123456" }]]);
                }
                expect(identifierRepository.findUniqueOrThrow.mock.calls).toEqual([
                    [{ where: { identity: "mail@example.test", account: ACTOR } }],
                ]);
            },
        );
    });

    describe("[Method] - verify", () => {
        it.each([ID, null])("[case] - verifies only the identifier bound to a valid code: %s", async (cached) => {
            // Arrange
            const { commands, otpCacheService, identifierService, transaction, run } = await helpers.commands();
            otpCacheService.consume.mockResolvedValue(cached);

            // Act
            const result = commands.verify({ input: { code: "123456" }, actor: ACTOR, context: CONTEXT });
            if (cached) {
                await result;
            } else {
                await Promise.allSettled([result]);
            }

            // Assert
            if (cached) {
                expect(identifierService.verify.mock.calls).toEqual([
                    [{ input: { identifier: ID }, transaction: transaction.entityManager }],
                ]);
            } else {
                await expect(result).rejects.toThrow();
                expect(run).not.toHaveBeenCalled();
            }
            expect(otpCacheService.consume.mock.calls).toEqual([[{ purpose: "identifier", key: "123456" }]]);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - passes the unverified filter through the existing removal pipeline", async () => {
            // Arrange
            const { commands, identifierService, transaction, run } = await helpers.commands();

            // Act
            await commands.purge({ input: { identifier: ID, isVerified: false }, actor: ACTOR, context: CONTEXT });
            const result = await run.mock.results[0]?.value;

            // Assert
            expect(identifierService.purge.mock.calls).toEqual([
                [{ input: { identifier: ID, account: ACTOR, isVerified: false }, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual({ account: ACTOR });
        });
    });

    describe("[Behavior] - identifier ownership", () => {
        it.each(["togglePublicContact", "purge"] as const)(
            "[case] - restricts %s to the actor's identifier",
            async (method) => {
                // Arrange
                const { commands, identifierService, transaction } = await helpers.commands();

                // Act
                await commands[method]({ input: { identifier: ID }, actor: ACTOR, context: CONTEXT });

                // Assert
                expect(identifierService[method].mock.calls).toEqual([
                    [{ input: { identifier: ID, account: ACTOR }, transaction: transaction.entityManager }],
                ]);
            },
        );
    });
});
