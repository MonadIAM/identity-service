import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { InterfaceClientFixture } from "~testing/integration/repositories/interface-client.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { TokenGrantType } from "~context/enums";

import { InterfaceClientRepository } from "./interface-client.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        INTERFACE_CLIENT_PER_REALM_LIMIT: 2,
    });
}

describe("InterfaceClientRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new InterfaceClientRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new InterfaceClientFixture(entityManager),
    });

    describe("findUniqueOrThrow", () => {
        it("maps the persisted interface client through the schema", async () => {
            const realm = "00000000-0000-4000-8000-000000000001";
            const client = await suite.fixtures().createInterfaceClient({
                redirectUris: ["https://mapping.test/callback", "https://mapping.test/silent"],
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                description: "Mapping interface client description",
                authAddress: "https://mapping.test/auth",
                name: "Mapping Interface Client",
                isSystemManaged: true,
                isRealmRevoked: true,
                realmVersion: 3,
                isRevoked: true,
                realm,
            });

            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: client.id } });

            expect(loaded).toMatchObject({
                redirectUris: ["https://mapping.test/callback", "https://mapping.test/silent"],
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                description: "Mapping interface client description",
                authAddress: "https://mapping.test/auth",
                name: "Mapping Interface Client",
                createdAt: client.createdAt,
                version: client.version,
                isSystemManaged: true,
                isRealmRevoked: true,
                realmVersion: 3,
                isRevoked: true,
                id: client.id,
            });
            expect(loaded.realm).toBe(realm);
        });
    });

    describe("wouldExceedRealmLimit", () => {
        it("checks interface client limit per realm", async () => {
            const { fullRealm, availableRealm } = await suite.fixtures().limitScenario();

            await suite.transaction(async (transaction) => {
                await expect(
                    suite.repository().wouldExceedRealmLimit({
                        transaction,
                        realm: fullRealm,
                    }),
                ).resolves.toBe(true);
                await expect(
                    suite.repository().wouldExceedRealmLimit({
                        transaction,
                        realm: availableRealm,
                    }),
                ).resolves.toBe(false);
            });
        });
    });
});
