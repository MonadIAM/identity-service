import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";

import { ApplicationFixture } from "~testing/fixtures/application.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { ApplicationRepository } from "./application.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        APPLICATION_PER_REALM_LIMIT: 2,
    });
}

describe("ApplicationRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ApplicationRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new ApplicationFixture(entityManager),
    });

    it("maps the persisted application through the schema", async () => {
        const application = await suite.fixtures().createApplication({
            description: "Mapping application description",
            name: "Mapping Application",
            isSystemManaged: true,
            isRealmRevoked: true,
            realm: randomUUID(),
            realmVersion: 3,
            isRevoked: true,
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: application.id } })).resolves.toMatchObject({
            description: "Mapping application description",
            createdAt: application.createdAt,
            version: application.version,
            name: "Mapping Application",
            realm: application.realm,
            isSystemManaged: true,
            isRealmRevoked: true,
            id: application.id,
            realmVersion: 3,
            isRevoked: true,
        });
    });

    it("checks application limit per realm", async () => {
        const { fullRealm, availableRealm } = await suite.fixtures().limitScenario();

        await suite.transaction(async (transaction) => {
            await expect(
                suite.repository().wouldExceedRealmLimit({
                    realm: fullRealm,
                    transaction,
                }),
            ).resolves.toBe(true);
            await expect(
                suite.repository().wouldExceedRealmLimit({
                    realm: availableRealm,
                    transaction,
                }),
            ).resolves.toBe(false);
        });
    });
});
