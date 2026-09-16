import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";

import { InterfaceClientMapper } from "./interface-client.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID         = "00000000-0000-4000-8000-500000000001";
const REALM_ID         = "00000000-0000-4000-8000-500000000002";
const APPLICATION_ID   = "00000000-0000-4000-8000-500000000003";
const FIRST_CLIENT_ID  = "00000000-0000-4000-8000-500000000004";
const SECOND_CLIENT_ID = "00000000-0000-4000-8000-500000000005";
/* eslint-enable prettier/prettier */

const mapper = new InterfaceClientMapper();
const helpers = new EntityFactoryRegistry();

describe("InterfaceClientMapper", () => {
    describe("interfaceClientPayload", () => {
        it("maps every client with its application and realm", () => {
            const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID });
            const first = helpers.createInterfaceClient({ id: FIRST_CLIENT_ID, application });
            const second = helpers.createInterfaceClient({ id: SECOND_CLIENT_ID, application });

            expect(mapper.interfaceClientPayload({ entities: [first, second], isRevoked: true, actor: ACTOR_ID })).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, isRevoked: true, id: FIRST_CLIENT_ID },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { application: APPLICATION_ID, isRevoked: true, id: SECOND_CLIENT_ID },
                },
            ]);
        });
    });
});
