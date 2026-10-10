import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { ServiceClientFixture } from "~testing/integration/repositories/service-client.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { ServiceClientRepository } from "./service-client.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        SERVICE_CLIENT_PER_REALM_LIMIT: 2,
    });
}

describe("[Repository] - ServiceClient", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ServiceClientRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new ServiceClientFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted service client through the schema", async () => {
            // Arrange
            const realm = "00000000-0000-4000-8000-000000000001";
            const client = await suite.fixtures().createServiceClient({
                description: "Mapping service client description",
                allowedAddresses: ["10.0.0.1", "10.0.0.2"],
                name: "Mapping Service Client",
                code: "mapping.service-client",
                isRealmRevoked: true,
                realmVersion: 3,
                isSystemManaged: true,
                isRevoked: true,
                realm,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: client.id } });

            // Assert
            expect(loaded).toMatchObject({
                description: "Mapping service client description",
                allowedAddresses: ["10.0.0.1", "10.0.0.2"],
                name: "Mapping Service Client",
                code: "mapping.service-client",
                createdAt: client.createdAt,
                isRealmRevoked: true,
                version: client.version,
                realmVersion: 3,
                isSystemManaged: true,
                isRevoked: true,
                id: client.id,
            });
            expect(loaded.realm).toBe(realm);
        });
    });

    describe("[Method] - wouldExceedRealmLimit", () => {
        it("[case] - checks service client limit per realm", async () => {
            // Arrange
            const { fullRealm, availableRealm } = await suite.fixtures().limitScenario();

            // Act
            const [full, available] = await suite.transaction(async (transaction) => {
                const full = await suite.repository().wouldExceedRealmLimit({ transaction, realm: fullRealm });
                const available = await suite.repository().wouldExceedRealmLimit({ transaction, realm: availableRealm });
                return [full, available];
            });

            // Assert
            expect(full).toBe(true);
            expect(available).toBe(false);
        });
    });
});
