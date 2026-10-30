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
                        account: account.id,
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
                await expect(result).resolves.toMatchObject({ identifier: { id: identifier.id } });
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

    describe("[Method] - selectNotificationEmail", () => {
        it.each([
            { type: IdentifierType.EMAIL, verified: true, owned: true, accepted: true },
            { type: IdentifierType.EMAIL, verified: false, owned: true, accepted: false },
            { type: IdentifierType.EMAIL, verified: true, owned: false, accepted: false },
            { type: IdentifierType.PHONE, verified: true, owned: true, accepted: false },
        ])(
            "[case] - accepts only a verified email owned by the account: %j",
            async ({ type, verified, owned, accepted }) => {
                // Arrange
                const account = await suite.fixtures().createAccount();
                const owner = owned ? account : await suite.fixtures().createAccount();
                const identifier = await suite.fixtures().createIdentifier({
                    identity: type === IdentifierType.EMAIL ? "selected@example.test" : "+15550000003",
                    isVerified: verified,
                    account: owner,
                    type,
                });

                // Act
                const result = suite.transaction((transaction) =>
                    suite.repository().identifierService.selectNotificationEmail({
                        input: { account: account.id, identifier: identifier.id },
                        transaction,
                    }),
                );
                await Promise.allSettled([result]);

                // Assert
                if (accepted) {
                    await expect(result).resolves.toMatchObject({ id: identifier.id });
                } else {
                    await expect(result).rejects.toThrow();
                }
            },
        );
    });

    describe("[Behavior] - email replacement", () => {
        it("[case] - returns the oldest remaining verified email, excluding drafts and other accounts", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const other = await suite.fixtures().createAccount();
            const removed = await suite
                .fixtures()
                .createIdentifier({ account, identity: "removed@example.test", isVerified: true });
            const oldest = await suite
                .fixtures()
                .createIdentifier({ account, identity: "oldest@example.test", isVerified: true });
            const newer = await suite
                .fixtures()
                .createIdentifier({ account, identity: "newer@example.test", isVerified: true });
            await suite.fixtures().createIdentifier({ account, identity: "draft@example.test" });
            await suite.fixtures().createIdentifier({ account: other, identity: "foreign@example.test", isVerified: true });
            await suite.transaction(async (transaction) => {
                await transaction.nativeUpdate(Identifier, { id: oldest.id }, { createdAt: new Date("2020-01-01") });
                await transaction.nativeUpdate(Identifier, { id: newer.id }, { createdAt: new Date("2021-01-01") });
            });

            // Act
            const result = await suite.transaction((transaction) =>
                suite.repository().identifierService.purge({
                    input: { account: account.id, identifier: removed.id },
                    transaction,
                }),
            );

            // Assert
            expect(result.replacement?.id).toBe(oldest.id);
            expect(result.identifier.id).toBe(removed.id);
        });
    });
});
