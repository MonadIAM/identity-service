import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { IdentifierUnitHelpers } from "~testing/unit/domain-service/identifier.helpers";
import { IdentifierType } from "~context/enums";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID    = "00000000-0000-4000-8000-200000000001";
const IDENTIFIER_ID = "00000000-0000-4000-8000-200000000002";
/* eslint-enable prettier/prettier */

const helpers = new IdentifierUnitHelpers();

describe("IdentifierService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("loads the account from the repository when it is given as an id", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });

            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    identifier: { identity: "new@example.com", type: IdentifierType.EMAIL },
                    account: ACCOUNT_ID,
                },
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(result).toEqual(
                expect.objectContaining({
                    identity: "new@example.com",
                    type: IdentifierType.EMAIL,
                    account,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });

        it("uses the given account entity without a repository lookup", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });

            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    identifier: { identity: "+70000000000", type: IdentifierType.PHONE },
                    account,
                },
            });

            expect(repositories.accounts.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(result.account).toBe(account);
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("verify", () => {
        it("throws when the identifier is already verified", async () => {
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            const verifySpy = jest.spyOn(identifier, "verify");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            await expect(
                service.verify({
                    transaction: transaction.entityManager,
                    input: { identifier: IDENTIFIER_ID },
                }),
            ).rejects.toThrow("services.identifier.ALREADY_VERIFIED");

            expect(verifySpy).not.toHaveBeenCalled();
        });

        it("verifies an unverified identifier", async () => {
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID });
            const { service, repositories, transaction } = helpers.service();
            const verifySpy = jest.spyOn(identifier, "verify");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            await service.verify({
                transaction: transaction.entityManager,
                input: { identifier: IDENTIFIER_ID },
            });

            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: IDENTIFIER_ID },
            });
            expect(verifySpy).toHaveBeenCalledTimes(1);
            expect(identifier.isVerified).toBe(true);
        });
    });

    describe("togglePublicContact", () => {
        it("scopes the lookup to the owning account and toggles the flag", async () => {
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            const toggleSpy = jest.spyOn(identifier, "togglePublicContact");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            await service.togglePublicContact({
                input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(toggleSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("purge", () => {
        it("throws when the identifier is the last verified one of the account", async () => {
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));
            repositories.identifiers.isLastVerifiedIdentifier.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.purge({
                    input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.identifier.CANNOT_REMOVE_LAST_VERIFIED");

            expect(repositories.identifiers.isLastVerifiedIdentifier).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifier: IDENTIFIER_ID,
                account: ACCOUNT_ID,
            });
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("removes the identifier when the account keeps another verified one", async () => {
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            await service.purge({
                input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: IDENTIFIER_ID, account: ACCOUNT_ID },
                options: { populate: ["account.password"] },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(identifier);
        });
    });
});
