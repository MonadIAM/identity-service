import { describe, expect, it } from "@jest/globals";

import { AccountCommandsUnitHelpers } from "~testing/unit/command-services/account.helpers";
import { IdentifierType, AccountSubject, AccountStatus, AccountTopicAction, KafkaTopic } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new AccountCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("[Commands] - Account", () => {
    describe("[Method] - signup", () => {
        it.each([
            { identifier: "mail@example.test", type: IdentifierType.EMAIL },
            { identifier: "+79991234567", type: IdentifierType.PHONE },
        ])(
            "[case] - registers $type using a password hash and caches verification for the new account",
            async ({ identifier, type }) => {
                // Arrange
                const {
                    commands,
                    accountService,
                    identifierRepository,
                    hashingService,
                    cryptoService,
                    otpCacheService,
                    transaction,
                    run,
                } = await helpers.commands();
                hashingService.hash.mockResolvedValue("password-hash");
                cryptoService.generateOTP.mockReturnValue("123456");
                const account = helpers.createAccount({ id: ACCOUNT });
                const primaryIdentifier = helpers.createIdentifier({ account, identity: identifier, type });
                identifierRepository.findUniqueOrThrow.mockResolvedValue(primaryIdentifier);
                accountService.create.mockReturnValue(account);

                // Act
                await commands.signup({
                    input: { identifier, password: "plain-password", name: "New User" },
                    context: CONTEXT,
                });
                const result = await run.mock.results[0]?.value;

                // Assert
                expect(hashingService.hash.mock.calls).toEqual([[{ value: "plain-password" }]]);
                expect(accountService.create.mock.calls).toEqual([
                    [
                        {
                            input: {
                                primaryIdentifier: { identity: identifier, type },
                                profile: { displayName: "New User", locale: "en", timeZone: "UTC" },
                                subject: AccountSubject.HUMAN,
                                status: AccountStatus.PENDING,
                                password: "password-hash",
                            },
                            transaction: transaction.entityManager,
                        },
                    ],
                ]);
                expect(otpCacheService.set.mock.calls).toEqual([
                    [{ purpose: "verification", value: ACCOUNT, key: "123456" }],
                ]);
                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        outbox: expect.objectContaining({
                            actionType: AccountTopicAction.CREATE,
                            destinationTopic: KafkaTopic.ACCOUNT,
                        }),
                    }),
                );
                expect(result).toEqual({
                    identifier: primaryIdentifier,
                    account: ACCOUNT,
                    timezone: "UTC",
                    otp: "123456",
                    locale: "en",
                });
            },
        );

        it("[case] - does not cache verification if account creation fails", async () => {
            // Arrange
            const { commands, accountService, hashingService, otpCacheService } = await helpers.commands();
            hashingService.hash.mockResolvedValue("hash");
            const failure = new Error("duplicate identifier");
            accountService.create.mockImplementation(() => {
                throw failure;
            });

            // Act
            const result = commands.signup({
                input: { identifier: "mail@example.test", password: "plain", name: "User" },
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toBe(failure);
            expect(otpCacheService.set).not.toHaveBeenCalled();
        });

        it("[case] - does not finish registration if storing its OTP fails", async () => {
            // Arrange
            const { commands, accountService, identifierRepository, otpCacheService, hashingService } =
                await helpers.commands();
            const account = helpers.createAccount({ id: ACCOUNT });
            identifierRepository.findUniqueOrThrow.mockResolvedValue(helpers.createIdentifier({ account }));
            accountService.create.mockReturnValue(account);
            hashingService.hash.mockResolvedValue("hash");
            otpCacheService.set.mockRejectedValue(new Error("cache unavailable"));

            // Act
            const result = commands.signup({
                input: { identifier: "user@example.test", password: "password", name: "User" },
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toThrow("cache unavailable");
        });
    });

    describe("[Method] - resend", () => {
        it.each([false, true])(
            "[case] - resends verification only for an unverified identifier: %s",
            async (isVerified) => {
                // Arrange
                const { commands, identifierRepository, otpCacheService, cryptoService, emit } = await helpers.commands();
                identifierRepository.findUniqueOrThrow.mockResolvedValue(
                    helpers.createIdentifier({ account: helpers.createAccount({ id: ACCOUNT }), isVerified }),
                );
                cryptoService.generateOTP.mockReturnValue("123456");

                // Act
                const result = commands.resend({ input: { identifier: "mail@example.test" }, context: CONTEXT });
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
                    expect(otpCacheService.set.mock.calls).toEqual([
                        [{ purpose: "verification", value: ACCOUNT, key: "123456" }],
                    ]);
                    expect(emit).toHaveBeenCalledWith(
                        expect.objectContaining({
                            actionType: AccountTopicAction.CREATE,
                            destinationTopic: KafkaTopic.ACCOUNT,
                            payload: expect.objectContaining({ account: ACCOUNT, otp: "123456" }),
                        }),
                    );
                }
            },
        );
    });

    describe("[Method] - verify", () => {
        it("[case] - verifies the cached account and persists hashed recovery codes in the same transaction", async () => {
            // Arrange
            const {
                commands,
                accountService,
                otpCacheService,
                cryptoService,
                hashingService,
                recoveryCodeService,
                run,
                transaction,
            } = await helpers.commands();
            const account = helpers.createAccount({ id: ACCOUNT });
            otpCacheService.consume.mockResolvedValue(ACCOUNT);
            cryptoService.generateRecoveryCodes.mockReturnValue(["first", "second"]);
            hashingService.hash.mockImplementation(({ value }) => Promise.resolve(`hash:${value}`));
            accountService.verify.mockResolvedValue(account);

            // Act
            const result = await commands.verify({ input: { code: "123456" }, context: CONTEXT });

            // Assert
            expect(otpCacheService.consume.mock.calls).toEqual([[{ purpose: "verification", key: "123456" }]]);
            expect(accountService.verify.mock.calls).toEqual([
                [{ input: { account: ACCOUNT }, transaction: transaction.entityManager }],
            ]);
            expect(recoveryCodeService.generate.mock.calls).toEqual([
                [{ input: { account, hashes: ["hash:first", "hash:second"] }, transaction: transaction.entityManager }],
            ]);
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        actionType: AccountTopicAction.VERIFY,
                        destinationTopic: KafkaTopic.ACCOUNT,
                    }),
                }),
            );
            expect(result.codes).toEqual(["first", "second"]);
        });

        it("[case] - rejects an expired verification code before changing the account", async () => {
            // Arrange
            const { commands, otpCacheService, run, recoveryCodeService } = await helpers.commands();
            otpCacheService.consume.mockResolvedValue(null);

            // Act
            const result = commands.verify({ input: { code: "expired" }, context: CONTEXT });

            // Assert
            await expect(result).rejects.toThrow();
            expect(run).not.toHaveBeenCalled();
            expect(recoveryCodeService.generate).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - deactivate", () => {
        it("[case] - deactivates the actor's own account", async () => {
            // Arrange
            const { commands, accountService, transaction } = await helpers.commands();

            // Act
            await commands.deactivate({ actor: ACTOR, context: CONTEXT });

            // Assert
            expect(accountService.deactivate.mock.calls).toEqual([
                [{ input: { account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });

    describe("[Behavior] - account status", () => {
        it.each([
            { command: "suspend", method: "suspend" },
            { command: "restore", method: "unsuspend" },
        ] as const)("[case] - $command targets the administratively selected account", async ({ command, method }) => {
            // Arrange
            const { commands, accountService, transaction } = await helpers.commands();

            // Act
            await commands[command]({ input: { account: ACCOUNT, reason: "Review" }, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(accountService[method].mock.calls).toEqual([
                [{ input: { account: ACCOUNT }, transaction: transaction.entityManager }],
            ]);
        });
    });
});
