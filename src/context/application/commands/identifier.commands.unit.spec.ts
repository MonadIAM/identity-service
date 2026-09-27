import { describe, expect, it } from "@jest/globals";

import { IdentifierCommandsUnitHelpers } from "~testing/unit/command-services/identifier.helpers";
import { IdentifierType } from "~context/enums";

const ACTOR = "actor-account";
const ID = "entity-a";
const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new IdentifierCommandsUnitHelpers();

describe("IdentifierCommands", () => {
    describe("create", () => {
        it("creates an actor-owned identifier and binds its verification code to the resulting identifier", async () => {
            const { commands, identifierService, cryptoService, otpCacheService, transaction } = await helpers.commands();
            cryptoService.generateOTP.mockReturnValue("123456");
            identifierService.create.mockResolvedValue(helpers.createIdentifier({ id: ID }));

            await commands.create({
                input: { identifier: "mail@example.test", type: IdentifierType.EMAIL },
                actor: ACTOR,
                context: CONTEXT,
            });

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

    describe("resend", () => {
        it.each([false, true])("resends only an unverified identifier owned by the actor: %s", async (isVerified) => {
            const { commands, identifierRepository, otpCacheService, cryptoService, emit } = await helpers.commands();
            identifierRepository.findUniqueOrThrow.mockResolvedValue(helpers.createIdentifier({ id: ID, isVerified }));
            cryptoService.generateOTP.mockReturnValue("123456");

            const result = commands.resend({ input: { identifier: "mail@example.test" }, actor: ACTOR, context: CONTEXT });

            if (isVerified) {
                await expect(result).rejects.toThrow();
                expect(otpCacheService.set).not.toHaveBeenCalled();
                expect(emit).not.toHaveBeenCalled();
            } else {
                await result;
                expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "identifier", value: ID, key: "123456" }]]);
            }
            expect(identifierRepository.findUniqueOrThrow.mock.calls).toEqual([
                [{ where: { identity: "mail@example.test", account: ACTOR } }],
            ]);
        });
    });

    describe("verify", () => {
        it.each([ID, null])("verifies only the identifier bound to a valid code: %s", async (cached) => {
            const { commands, otpCacheService, identifierService, transaction, run } = await helpers.commands();
            otpCacheService.consume.mockResolvedValue(cached);

            const result = commands.verify({ input: { code: "123456" }, actor: ACTOR, context: CONTEXT });

            if (cached) {
                await result;
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

    describe("togglePublicContact / purge", () => {
        it.each(["togglePublicContact", "purge"] as const)("restricts %s to the actor's identifier", async (method) => {
            const { commands, identifierService, transaction } = await helpers.commands();

            await commands[method]({ input: { identifier: ID }, actor: ACTOR, context: CONTEXT });

            expect(identifierService[method].mock.calls).toEqual([
                [{ input: { identifier: ID, account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });
});
