import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { ServiceClientFixture } from "~testing/integration/repositories/service-client.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { ServiceClientRepository } from "./service-client.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        SERVICE_CLIENT_PER_APPLICATION_LIMIT: 2,
    });
}

describe("ServiceClientRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ServiceClientRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new ServiceClientFixture(entityManager),
    });

    it("maps the persisted service client through the schema", async () => {
        const application = await suite.fixtures().createApplication();
        const client = await suite.fixtures().createServiceClient({
            description: "Mapping service client description",
            allowedAddresses: ["10.0.0.1", "10.0.0.2"],
            name: "Mapping Service Client",
            code: "mapping.service-client",
            isApplicationRevoked: true,
            applicationVersion: 3,
            isSystemManaged: true,
            isRevoked: true,
            application,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: client.id } });

        expect(loaded).toMatchObject({
            description: "Mapping service client description",
            allowedAddresses: ["10.0.0.1", "10.0.0.2"],
            name: "Mapping Service Client",
            code: "mapping.service-client",
            createdAt: client.createdAt,
            isApplicationRevoked: true,
            version: client.version,
            applicationVersion: 3,
            isSystemManaged: true,
            isRevoked: true,
            id: client.id,
        });
        expect(loaded.application.id).toBe(application.id);
    });

    it("checks service client limit per application", async () => {
        const { fullApplication, availableApplication } = await suite.fixtures().limitScenario();

        await suite.transaction(async (transaction) => {
            await expect(
                suite.repository().wouldExceedApplicationLimit({
                    transaction,
                    application: fullApplication.id,
                }),
            ).resolves.toBe(true);
            await expect(
                suite.repository().wouldExceedApplicationLimit({
                    transaction,
                    application: availableApplication.id,
                }),
            ).resolves.toBe(false);
        });
    });
});
