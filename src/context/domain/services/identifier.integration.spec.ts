import { describe, expect, it } from "@jest/globals";

import { IdentifierIntegrationHelpers } from "~testing/integration/domain-service/identifier.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { Identifier } from "~context/domain/entities";
import { IdentifierType } from "~context/enums";

const helpers = new IdentifierIntegrationHelpers();

async function loadIdentifiers(
    suite: Integration.Domain.Identifier.Suite,
    account: Entities.Account,
): Promise<Entities.Identifier[]> {
    return await suite.transaction((transaction) =>
        transaction.find(Identifier, { account: account.id }, { orderBy: { identity: "asc" } }),
    );
}

describe("[DomainService] - Identifier", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates an identifier for an account", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            await suite.transaction((transaction) =>
                suite.repository().identifierService.create({
                    input: {
                        identifier: {
                            identity: "+15550000002",
                            type: IdentifierType.PHONE,
                        },
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const identifiers = await loadIdentifiers(suite, account);

            // Assert
            expect(identifiers).toHaveLength(1);
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isPublicContact: false,
                isVerified: false,
            });
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - verifies an identifier", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "+15550000002",
                type: IdentifierType.PHONE,
                account,
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().identifierService.verify({
                    input: {
                        identifier: identifier.id,
                    },
                    transaction,
                }),
            );
            const identifiers = await loadIdentifiers(suite, account);

            // Assert
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isVerified: true,
            });
            expect(identifiers[0]?.verifiedAt).toBeInstanceOf(Date);
        });
    });

    describe("[Method] - togglePublicContact", () => {
        it("[case] - toggles public contact for an account-scoped identifier", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "+15550000002",
                type: IdentifierType.PHONE,
                isVerified: true,
                account,
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().identifierService.togglePublicContact({
                    input: {
                        identifier: identifier.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const identifiers = await loadIdentifiers(suite, account);

            // Assert
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isPublicContact: true,
            });
        });
    });

    describe("[Method] - purge", () => {
        it.each([
            { verified: false, owned: true, removed: true },
            { verified: true, owned: true, removed: false },
            { verified: false, owned: false, removed: false },
        ])("[case] - restricts unverified removal by state and ownership: %j", async ({ verified, owned, removed }) => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const owner = owned ? account : await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "draft@example.test",
                isVerified: verified,
                account: owner,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().identifierService.purge({
                    input: { identifier: identifier.id, account: account.id, isVerified: false },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const identifiers = await loadIdentifiers(suite, owner);

            // Assert
            if (removed) {
                await expect(result).resolves.toBeUndefined();
                expect(identifiers).toHaveLength(0);
            } else {
                await expect(result).rejects.toThrow();
                expect(identifiers).toHaveLength(1);
                expect(identifiers[0].id).toBe(identifier.id);
            }
        });

        it("[case] - purges an account-scoped identifier", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const primary = await suite.fixtures().createIdentifier({
                identity: "owner@example.test",
                isVerified: true,
                account,
            });
            const secondary = await suite.fixtures().createIdentifier({
                identity: "+15550000002",
                type: IdentifierType.PHONE,
                isVerified: true,
                account,
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().identifierService.purge({
                    input: {
                        identifier: primary.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const identifiers = await loadIdentifiers(suite, account);

            // Assert
            expect(identifiers).toHaveLength(1);
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isVerified: true,
            });
            expect(identifiers[0]?.id).toBe(secondary.id);
        });

        it("[case] - keeps the last verified identifier when purge is rejected", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "last@example.test",
                isVerified: true,
                account,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().identifierService.purge({
                    input: {
                        identifier: identifier.id,
                        account: account.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await loadIdentifiers(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.identifier.CANNOT_REMOVE_LAST_VERIFIED");
            expect(result1).toHaveLength(1);
        });
    });
});
