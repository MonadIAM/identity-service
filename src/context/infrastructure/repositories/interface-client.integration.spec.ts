import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { InterfaceClientFixture } from "~testing/integration/repositories/interface-client.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { TokenGrantType } from "~context/enums";

import { InterfaceClientRepository } from "./interface-client.repository";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        INTERFACE_CLIENT_PER_APPLICATION_LIMIT: 2,
    });
}

describe("InterfaceClientRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new InterfaceClientRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new InterfaceClientFixture(entityManager),
    });

    it("maps the persisted interface client through the schema", async () => {
        const application = await suite.fixtures().createApplication();
        const client = await suite.fixtures().createInterfaceClient({
            redirectUris: ["https://mapping.test/callback", "https://mapping.test/silent"],
            grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
            description: "Mapping interface client description",
            authAddress: "https://mapping.test/auth",
            name: "Mapping Interface Client",
            isApplicationRevoked: true,
            applicationVersion: 3,
            isSystemManaged: true,
            isRevoked: true,
            application,
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
            isApplicationRevoked: true,
            applicationVersion: 3,
            isSystemManaged: true,
            isRevoked: true,
            id: client.id,
        });
        expect(loaded.application.id).toBe(application.id);
    });

    it("checks interface client limit per application", async () => {
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
