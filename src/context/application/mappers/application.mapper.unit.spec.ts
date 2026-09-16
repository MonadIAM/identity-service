import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";

import { ApplicationMapper } from "./application.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID              = "00000000-0000-4000-8000-100000000001";
const REALM_ID              = "00000000-0000-4000-8000-100000000002";
const SECOND_REALM_ID       = "00000000-0000-4000-8000-100000000003";
const APPLICATION_ID        = "00000000-0000-4000-8000-100000000004";
const SECOND_APPLICATION_ID = "00000000-0000-4000-8000-100000000005";
const INTERFACE_CLIENT_ID   = "00000000-0000-4000-8000-100000000006";
const SECOND_INTERFACE_ID   = "00000000-0000-4000-8000-100000000007";
const SERVICE_CLIENT_ID     = "00000000-0000-4000-8000-100000000008";
const SECOND_SERVICE_ID     = "00000000-0000-4000-8000-100000000009";
/* eslint-enable prettier/prettier */

const mapper = new ApplicationMapper();
const helpers = new EntityFactoryRegistry();

function createApplications(): Entities.Application[] {
    const first = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID });
    const second = helpers.createApplication({ id: SECOND_APPLICATION_ID, realm: SECOND_REALM_ID });
    const interfaceClients = [
        helpers.createInterfaceClient({ id: INTERFACE_CLIENT_ID, application: first }),
        helpers.createInterfaceClient({ id: SECOND_INTERFACE_ID, application: first }),
    ];
    const serviceClients = [
        helpers.createServiceClient({ id: SERVICE_CLIENT_ID, code: "billing", application: first }),
        helpers.createServiceClient({ id: SECOND_SERVICE_ID, code: "analytics", application: second }),
    ];
    first.interfaceClients = helpers.collection({ owner: first, items: interfaceClients });
    first.serviceClients = helpers.collection({ owner: first, items: [serviceClients[0]] });
    second.serviceClients = helpers.collection({ owner: second, items: [serviceClients[1]] });

    return [first, second];
}

describe("ApplicationMapper", () => {
    describe("interfaceClientOutboxPayload", () => {
        it("flattens interface clients from all applications", () => {
            expect(
                mapper.interfaceClientOutboxPayload({ entities: createApplications(), isRevoked: true, actor: ACTOR_ID }),
            ).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, id: INTERFACE_CLIENT_ID, isRevoked: true },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, id: SECOND_INTERFACE_ID, isRevoked: true },
                },
            ]);
        });
    });

    describe("serviceClientOutboxPayload", () => {
        it("flattens service clients and keeps each application realm", () => {
            expect(mapper.serviceClientOutboxPayload({ entities: createApplications(), actor: ACTOR_ID })).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, code: "billing", id: SERVICE_CLIENT_ID },
                },
                {
                    actor: ACTOR_ID,
                    realm: SECOND_REALM_ID,
                    input: { application: SECOND_APPLICATION_ID, code: "analytics", id: SECOND_SERVICE_ID },
                },
            ]);
        });
    });
});
