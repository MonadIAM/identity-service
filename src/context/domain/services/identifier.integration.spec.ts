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

describe("IdentifierService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("create", () => {
        it("creates an identifier for an account", async () => {
            const account = await suite.fixtures().createAccount();

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

            expect(identifiers).toHaveLength(1);
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isPublicContact: false,
                isVerified: false,
            });
        });
    });

    describe("verify", () => {
        it("verifies an identifier", async () => {
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "+15550000002",
                type: IdentifierType.PHONE,
                account,
            });

            await suite.transaction((transaction) =>
                suite.repository().identifierService.verify({
                    input: {
                        identifier: identifier.id,
                    },
                    transaction,
                }),
            );

            const identifiers = await loadIdentifiers(suite, account);

            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isVerified: true,
            });
            expect(identifiers[0]?.verifiedAt).toBeInstanceOf(Date);
        });
    });

    describe("togglePublicContact", () => {
        it("toggles public contact for an account-scoped identifier", async () => {
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "+15550000002",
                type: IdentifierType.PHONE,
                isVerified: true,
                account,
            });

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

            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isPublicContact: true,
            });
        });
    });

    describe("purge", () => {
        it("purges an account-scoped identifier", async () => {
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

            expect(identifiers).toHaveLength(1);
            expect(identifiers[0]).toMatchObject({
                identity: "+15550000002",
                isVerified: true,
            });
            expect(identifiers[0]?.id).toBe(secondary.id);
        });

        it("keeps the last verified identifier when purge is rejected", async () => {
            const account = await suite.fixtures().createAccount();
            const identifier = await suite.fixtures().createIdentifier({
                identity: "last@example.test",
                isVerified: true,
                account,
            });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().identifierService.purge({
                        input: {
                            identifier: identifier.id,
                            account: account.id,
                        },
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.identifier.CANNOT_REMOVE_LAST_VERIFIED");

            await expect(loadIdentifiers(suite, account)).resolves.toHaveLength(1);
        });
    });
});
