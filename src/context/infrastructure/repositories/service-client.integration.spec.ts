import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { ServiceClientFixture } from "~testing/integration/repositories/service-client.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { ServiceClientRepository } from "./service-client.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        SERVICE_CLIENT_PER_REALM_LIMIT: 2,
    });
}

describe("ServiceClientRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ServiceClientRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new ServiceClientFixture(entityManager),
    });

    it("maps the persisted service client through the schema", async () => {
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

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: client.id } });

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

    it("checks service client limit per realm", async () => {
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
