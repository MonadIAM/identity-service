import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";

import { ServiceClientMapper } from "./service-client.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID          = "00000000-0000-4000-8000-c00000000001";
const REALM_ID          = "00000000-0000-4000-8000-c00000000002";
const APPLICATION_ID    = "00000000-0000-4000-8000-c00000000003";
const SERVICE_CLIENT_ID = "00000000-0000-4000-8000-c00000000004";
const SECOND_SERVICE_ID = "00000000-0000-4000-8000-c00000000005";
/* eslint-enable prettier/prettier */

const mapper = new ServiceClientMapper();
const helpers = new EntityFactoryRegistry();

function createClient(id: string, code: string): Entities.ServiceClient {
    const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID });
    return helpers.createServiceClient({ id, code, application });
}

describe("ServiceClientMapper", () => {
    describe("serviceClientPayload", () => {
        it("maps a single service client to one payload", () => {
            const serviceClient = createClient(SERVICE_CLIENT_ID, "billing");

            expect(mapper.serviceClientPayload({ serviceClients: serviceClient, actor: ACTOR_ID })).toEqual({
                actor: ACTOR_ID,
                realm: REALM_ID,
                input: { application: APPLICATION_ID, code: "billing", id: SERVICE_CLIENT_ID },
            });
        });

        it("maps an array of service clients to an array of payloads", () => {
            const first = createClient(SERVICE_CLIENT_ID, "billing");
            const second = createClient(SECOND_SERVICE_ID, "analytics");

            expect(mapper.serviceClientPayload({ serviceClients: [first, second], actor: ACTOR_ID })).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, code: "billing", id: SERVICE_CLIENT_ID },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, code: "analytics", id: SECOND_SERVICE_ID },
                },
            ]);
        });
    });
});
