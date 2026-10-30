import { describe, expect, it, jest, afterEach } from "@jest/globals";

import { ReauthenticationCommandsUnitHelpers } from "~testing/unit/command-services/reauthentication.helpers";
import {
    ReauthenticationTopicAction,
    NotificationTopicAction,
    ReauthenticationMethod,
    IdentifierType,
    KafkaTopic,
} from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ReauthenticationCommandsUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("[Commands] - Reauthentication", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - resolveEmail", () => {
        it("[case] - selects the first verified email from identifiers ordered within the transaction", async () => {
            // Arrange
            const { commands, accountRepository, transaction } = helpers.commands();
            const account = helpers.createAccount({ id: ACTOR });
            const email = helpers.createIdentifier({
                account,
                id: "verified-email",
                type: IdentifierType.EMAIL,
                isVerified: true,
            });
            account.identifiers = helpers.collection({
                owner: account,
                items: [
                    helpers.createIdentifier({ account, type: IdentifierType.PHONE, isVerified: true }),
                    helpers.createIdentifier({ account, type: IdentifierType.EMAIL, isVerified: false }),
                    email,
                    helpers.createIdentifier({ account, type: IdentifierType.EMAIL, isVerified: true }),
                ],
            });
            account.secondFactors = helpers.collection({
                owner: account,
                items: [helpers.createSecondFactor({ account, confirmedAt: undefined })],
            });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);

            // Act
            const result = await commands.resolveEmail({ actor: ACTOR, transaction: transaction.entityManager });

            // Assert
            expect(result === email).toBe(true);
            expect(accountRepository.findUniqueOrThrow.mock.calls[0][0]).toEqual({
                transaction: transaction.entityManager,
                options: {
                    populate: ["password", "secondFactors", "identifiers"],
                    orderBy: { identifiers: { createdAt: "asc", id: "asc" } },
                },
                where: { id: ACTOR },
            });
        });

        it.each(["password", "second-factor"])(
            "[case] - rejects email confirmation when %s is configured",
            async (method) => {
                // Arrange
                const { commands, accountRepository, transaction } = helpers.commands();
                const account = helpers.createAccount({ id: ACTOR });
                if (method === "password") {
                    account.password = helpers.createPassword({ account });
                } else {
                    account.secondFactors = helpers.collection({
                        owner: account,
                        items: [helpers.createSecondFactor({ account, confirmedAt: new Date() })],
                    });
                }
                accountRepository.findUniqueOrThrow.mockResolvedValue(account);

                // Act
                const result = commands.resolveEmail({ actor: ACTOR, transaction: transaction.entityManager });

                // Assert
                await expect(result).rejects.toThrow("commands.reauthentication.EMAIL_CONFIRMATION_UNAVAILABLE");
            },
        );

        it.each(["missing", "unverified", "phone"])("[case] - rejects %s email credentials", async (state) => {
            // Arrange
            const { commands, accountRepository, transaction } = helpers.commands();
            const account = helpers.createAccount({ id: ACTOR });
            account.identifiers = helpers.collection({
                owner: account,
                items:
                    state === "missing"
                        ? []
                        : [
                              helpers.createIdentifier({
                                  account,
                                  type: state === "phone" ? IdentifierType.PHONE : IdentifierType.EMAIL,
                                  isVerified: state === "phone",
                              }),
                          ],
            });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);

            // Act
            const result = commands.resolveEmail({ actor: ACTOR, transaction: transaction.entityManager });

            // Assert
            await expect(result).rejects.toThrow("commands.reauthentication.VERIFIED_EMAIL_REQUIRED");
        });
    });

    describe("[Method] - requestOTP", () => {
        it("[case] - hashes outside the transaction and binds the code to the actor, session and email", async () => {
            // Arrange
            const { commands, accountRepository, cryptoService, otpCacheService, run, transaction } = helpers.commands();
            const account = helpers.createAccount({ id: ACTOR });
            const email = helpers.createIdentifier({
                account,
                type: IdentifierType.EMAIL,
                isVerified: true,
                identity: "verified@example.test",
            });
            account.identifiers = helpers.collection({ owner: account, items: [email] });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);
            cryptoService.generateOTP.mockReturnValue("123456");
            cryptoService.hashToken.mockReturnValue("otp-hash");

            // Act
            const result = await commands.requestOTP({ actor: ACTOR, session: ID, context: CONTEXT });

            // Assert
            expect(result).toEqual({ message: "commands.reauthentication.CODE_SENT" });
            expect(cryptoService.hashToken).toHaveBeenCalledWith({ token: `${ACTOR}:${ID}:123456` });
            expect(cryptoService.hashToken.mock.invocationCallOrder[0]).toBeLessThan(run.mock.invocationCallOrder[0]);
            expect(accountRepository.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ transaction: transaction.entityManager }),
            );
            expect(otpCacheService.set).toHaveBeenCalledWith({
                purpose: "reauthentication",
                key: ID,
                value: `${email.id}:otp-hash`,
            });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        destinationTopic: KafkaTopic.NOTIFICATION,
                        actionType: NotificationTopicAction.CREATE,
                    }),
                }),
            );
            await expect(run.mock.results[0].value).resolves.toEqual({
                account: ACTOR,
                address: email.identity,
                otp: "123456",
            });
        });

        it("[case] - does not cache a code when no verified email is available", async () => {
            // Arrange
            const { commands, accountRepository, otpCacheService } = helpers.commands();
            accountRepository.findUniqueOrThrow.mockResolvedValue(helpers.createAccount({ id: ACTOR }));

            // Act
            const result = commands.requestOTP({ actor: ACTOR, session: ID, context: CONTEXT });

            // Assert
            await expect(result).rejects.toThrow("commands.reauthentication.VERIFIED_EMAIL_REQUIRED");

            expect(otpCacheService.set).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - byOTP", () => {
        it("[case] - consumes the bound code and grants only the current session after the transaction", async () => {
            // Arrange
            const { commands, accountRepository, cryptoService, otpCacheService, reauthenticationCacheService, run } =
                helpers.commands();
            jest.spyOn(Date, "now").mockReturnValue(1000000);
            const account = helpers.createAccount({ id: ACTOR });
            const email = helpers.createIdentifier({ account, type: IdentifierType.EMAIL, isVerified: true });
            account.identifiers = helpers.collection({ owner: account, items: [email] });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);
            cryptoService.hashToken.mockReturnValue("otp-hash");
            otpCacheService.consume.mockResolvedValue(`${email.id}:otp-hash`);

            // Act
            const result = await commands.byOTP({ actor: ACTOR, session: ID, context: CONTEXT, input: { code: "123456" } });

            // Assert
            expect(result).toEqual({ message: "commands.reauthentication.REAUTHENTICATED" });
            expect(cryptoService.hashToken).toHaveBeenCalledWith({ token: `${ACTOR}:${ID}:123456` });
            expect(cryptoService.hashToken.mock.invocationCallOrder[0]).toBeLessThan(run.mock.invocationCallOrder[0]);
            expect(otpCacheService.consume).toHaveBeenCalledWith({ purpose: "reauthentication", key: ID });
            expect(reauthenticationCacheService.set).toHaveBeenCalledWith({
                session: ID,
                ttl: 300,
                proof: { method: ReauthenticationMethod.OTP },
            });
            await expect(run.mock.results[0].value).resolves.toEqual({
                proof: { method: ReauthenticationMethod.OTP },
                expiresAt: 1300000,
                session: ID,
            });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    outbox: expect.objectContaining({
                        destinationTopic: KafkaTopic.REAUTHENTICATION,
                        actionType: ReauthenticationTopicAction.GRANT,
                    }),
                }),
            );
        });

        it.each([null, "email-id:wrong-hash", "other-email:otp-hash"])(
            "[case] - refuses a missing or mismatched code: %s",
            async (cached) => {
                // Arrange
                const { commands, accountRepository, cryptoService, otpCacheService, reauthenticationCacheService } =
                    helpers.commands();
                const account = helpers.createAccount({ id: ACTOR });
                account.identifiers = helpers.collection({
                    owner: account,
                    items: [
                        helpers.createIdentifier({ account, id: "email-id", type: IdentifierType.EMAIL, isVerified: true }),
                    ],
                });
                accountRepository.findUniqueOrThrow.mockResolvedValue(account);
                cryptoService.hashToken.mockReturnValue("otp-hash");
                otpCacheService.consume.mockResolvedValue(cached);

                // Act
                const result = commands.byOTP({ actor: ACTOR, session: ID, context: CONTEXT, input: { code: "123456" } });

                // Assert
                await expect(result).rejects.toThrow("commands.reauthentication.INVALID_OR_EXPIRED_CODE");

                expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
            },
        );

        it("[case] - rejects code reuse after the first consumption", async () => {
            // Arrange
            const { commands, accountRepository, cryptoService, otpCacheService, reauthenticationCacheService } =
                helpers.commands();
            const account = helpers.createAccount({ id: ACTOR });
            const email = helpers.createIdentifier({ account, type: IdentifierType.EMAIL, isVerified: true });
            account.identifiers = helpers.collection({ owner: account, items: [email] });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);
            cryptoService.hashToken.mockReturnValue("otp-hash");
            otpCacheService.consume.mockResolvedValueOnce(`${email.id}:otp-hash`).mockResolvedValueOnce(null);
            const props = { actor: ACTOR, session: ID, context: CONTEXT, input: { code: "123456" } };

            // Act
            await commands.byOTP(props);
            const result = commands.byOTP(props);

            // Assert
            await expect(result).rejects.toThrow("commands.reauthentication.INVALID_OR_EXPIRED_CODE");

            expect(reauthenticationCacheService.set).toHaveBeenCalledTimes(1);
        });

        it("[case] - rechecks eligibility before consuming the code", async () => {
            // Arrange
            const { commands, accountRepository, otpCacheService, reauthenticationCacheService } = helpers.commands();
            accountRepository.findUniqueOrThrow.mockResolvedValue(
                helpers.createAccount({ password: helpers.createPassword() }),
            );

            // Act
            const result = commands.byOTP({ actor: ACTOR, session: ID, context: CONTEXT, input: { code: "123456" } });

            // Assert
            await expect(result).rejects.toThrow("commands.reauthentication.EMAIL_CONFIRMATION_UNAVAILABLE");

            expect(otpCacheService.consume).not.toHaveBeenCalled();
            expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
        });

        it("[case] - does not grant access if the transaction fails", async () => {
            // Arrange
            const { commands, run, reauthenticationCacheService } = helpers.commands();
            const error = new Error("Transaction failed");
            run.mockRejectedValue(error);

            // Act
            const result = commands.byOTP({ actor: ACTOR, session: ID, context: CONTEXT, input: { code: "123456" } });

            // Assert
            await expect(result).rejects.toBe(error);

            expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - byPassword", () => {
        it.each(["missing", "invalid"])("[case] - does not grant reauthentication for a %s password", async (state) => {
            // Arrange
            const { commands, accountRepository, hashingService, emit, reauthenticationCacheService } = helpers.commands();
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
            expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
        });

        it("[case] - grants password reauthentication only for the current session and configured TTL", async () => {
            // Arrange
            const { commands, accountRepository, hashingService, emit, reauthenticationCacheService } = helpers.commands();
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
            expect(emit.mock.calls).toEqual([
                [
                    expect.objectContaining({
                        payload: {
                            proof: { method: ReauthenticationMethod.PASSWORD },
                            session: ID,
                            expiresAt: 1300000,
                        },
                    }),
                ],
            ]);
            expect(reauthenticationCacheService.set).toHaveBeenCalledWith({
                session: ID,
                ttl: 300,
                proof: { method: ReauthenticationMethod.PASSWORD },
            });
        });
    });

    describe("[Method] - bySecondFactor", () => {
        it("[case] - verifies the actor's second factor before preparing a session grant", async () => {
            // Arrange
            const { commands, secondFactorService, run, transaction, reauthenticationCacheService } = helpers.commands();
            jest.spyOn(Date, "now").mockReturnValue(1000000);
            const factor = helpers.createSecondFactor({ id: "verified-factor", confirmedAt: new Date() });
            secondFactorService.reauthenticate.mockResolvedValue(factor);

            // Act
            await commands.bySecondFactor({ input: { code: "123456" }, actor: ACTOR, session: ID, context: CONTEXT });
            const result = await run.mock.results[0]?.value;

            // Assert
            expect(secondFactorService.reauthenticate.mock.calls).toEqual([
                [{ input: { account: ACTOR, code: "123456" }, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual({
                proof: { method: ReauthenticationMethod.TOTP, factor: factor.id },
                session: ID,
                expiresAt: 1300000,
            });
            expect(reauthenticationCacheService.set).toHaveBeenCalledWith({
                session: ID,
                ttl: 300,
                proof: { method: ReauthenticationMethod.TOTP, factor: factor.id },
            });
        });

        it("[case] - does not cache a proof when the second factor is rejected", async () => {
            // Arrange
            const { commands, secondFactorService, reauthenticationCacheService } = helpers.commands();
            const error = new Error("Invalid TOTP");
            secondFactorService.reauthenticate.mockRejectedValue(error);

            // Act
            const result = commands.bySecondFactor({
                input: { code: "123456" },
                actor: ACTOR,
                session: ID,
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
        });

        it("[case] - does not cache a proof when the transaction fails after verification", async () => {
            // Arrange
            const { commands, secondFactorService, run, transaction, reauthenticationCacheService } = helpers.commands();
            secondFactorService.reauthenticate.mockResolvedValue(helpers.createSecondFactor());
            const error = new Error("Commit failed");
            run.mockImplementationOnce(async (props) => {
                await props.execute(transaction.entityManager);
                throw error;
            });

            // Act
            const result = commands.bySecondFactor({
                input: { code: "123456" },
                actor: ACTOR,
                session: ID,
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(secondFactorService.reauthenticate).toHaveBeenCalledTimes(1);
            expect(reauthenticationCacheService.set).not.toHaveBeenCalled();
        });
    });
});
