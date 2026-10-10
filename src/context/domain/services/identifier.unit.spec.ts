import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { IdentifierUnitHelpers } from "~testing/unit/domain-service/identifier.helpers";
import { IdentifierType } from "~context/enums";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID    = "00000000-0000-4000-8000-200000000001";
const IDENTIFIER_ID = "00000000-0000-4000-8000-200000000002";
/* eslint-enable prettier/prettier */

const helpers = new IdentifierUnitHelpers();

describe("[DomainService] - Identifier", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - loads the account from the repository when it is given as an id", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    identifier: { identity: "new@example.com", type: IdentifierType.EMAIL },
                    account: ACCOUNT_ID,
                },
            });

            // Assert
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

        it("[case] - uses the given account entity without a repository lookup", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: {
                    identifier: { identity: "+70000000000", type: IdentifierType.PHONE },
                    account,
                },
            });

            // Assert
            expect(repositories.accounts.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(result.account).toBe(account);
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - throws when the identifier is already verified", async () => {
            // Arrange
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            const verifySpy = jest.spyOn(identifier, "verify");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            // Act
            const result = service.verify({
                transaction: transaction.entityManager,
                input: { identifier: IDENTIFIER_ID },
            });

            // Assert
            await expect(result).rejects.toThrow("services.identifier.ALREADY_VERIFIED");
            expect(verifySpy).not.toHaveBeenCalled();
        });

        it("[case] - verifies an unverified identifier", async () => {
            // Arrange
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID });
            const { service, repositories, transaction } = helpers.service();
            const verifySpy = jest.spyOn(identifier, "verify");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            // Act
            await service.verify({
                transaction: transaction.entityManager,
                input: { identifier: IDENTIFIER_ID },
            });

            // Assert
            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: IDENTIFIER_ID },
            });
            expect(verifySpy).toHaveBeenCalledTimes(1);
            expect(identifier.isVerified).toBe(true);
        });
    });

    describe("[Method] - togglePublicContact", () => {
        it("[case] - scopes the lookup to the owning account and toggles the flag", async () => {
            // Arrange
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            const toggleSpy = jest.spyOn(identifier, "togglePublicContact");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            // Act
            await service.togglePublicContact({
                input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(toggleSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - purge", () => {
        it("[case] - throws when the identifier is the last verified one of the account", async () => {
            // Arrange
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));
            repositories.identifiers.isLastVerifiedIdentifier.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.purge({
                input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.identifier.CANNOT_REMOVE_LAST_VERIFIED");
            expect(repositories.identifiers.isLastVerifiedIdentifier).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                identifier: IDENTIFIER_ID,
                account: ACCOUNT_ID,
            });
            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("[case] - removes the identifier when the account keeps another verified one", async () => {
            // Arrange
            const identifier = helpers.createIdentifier({ id: IDENTIFIER_ID, isVerified: true });
            const { service, repositories, transaction } = helpers.service();
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() => Promise.resolve(identifier));

            // Act
            await service.purge({
                input: { identifier: IDENTIFIER_ID, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: IDENTIFIER_ID, account: ACCOUNT_ID },
                options: { populate: ["account.password"] },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(identifier);
        });
    });
});
