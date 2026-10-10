import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { ServiceClientMapper } from "./service-client.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID          = "00000000-0000-4000-8000-c00000000001";
const REALM_ID          = "00000000-0000-4000-8000-c00000000002";
const SERVICE_CLIENT_ID = "00000000-0000-4000-8000-c00000000004";
const SECOND_SERVICE_ID = "00000000-0000-4000-8000-c00000000005";
/* eslint-enable prettier/prettier */

const mapper = new ServiceClientMapper();
const helpers = new EntityFactoryRegistry();

function createClient(id: string, code: string): Entities.ServiceClient {
    return helpers.createServiceClient({ id, code, realm: REALM_ID });
}

describe("[DataMapper] - ServiceClient", () => {
    describe("[Method] - serviceClientPayload", () => {
        it("[case] - maps a single service client to one payload", () => {
            // Arrange
            const serviceClient = createClient(SERVICE_CLIENT_ID, "billing");

            // Act
            const result = mapper.serviceClientPayload({ serviceClients: serviceClient, actor: ACTOR_ID });

            // Assert
            expect(result).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: { code: "billing", id: SERVICE_CLIENT_ID },
            });
        });

        it("[case] - maps an array of service clients to an array of payloads", () => {
            // Arrange
            const first = createClient(SERVICE_CLIENT_ID, "billing");
            const second = createClient(SECOND_SERVICE_ID, "analytics");

            // Act
            const result = mapper.serviceClientPayload({ serviceClients: [first, second], actor: ACTOR_ID });

            // Assert
            expect(result).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { code: "billing", id: SERVICE_CLIENT_ID },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { code: "analytics", id: SECOND_SERVICE_ID },
                },
            ]);
        });
    });
});
