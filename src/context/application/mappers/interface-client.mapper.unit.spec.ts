import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { InterfaceClientMapper } from "./interface-client.mapper";

/* eslint-disable prettier/prettier */
const ACTOR_ID         = "00000000-0000-4000-8000-500000000001";
const REALM_ID         = "00000000-0000-4000-8000-500000000002";
const FIRST_CLIENT_ID  = "00000000-0000-4000-8000-500000000004";
const SECOND_CLIENT_ID = "00000000-0000-4000-8000-500000000005";
/* eslint-enable prettier/prettier */

const mapper = new InterfaceClientMapper();
const helpers = new EntityFactoryRegistry();

describe("InterfaceClientMapper", () => {
    describe("interfaceClientPayload", () => {
        it("maps every client with its realm", () => {
            const first = helpers.createInterfaceClient({ id: FIRST_CLIENT_ID, realm: REALM_ID });
            const second = helpers.createInterfaceClient({ id: SECOND_CLIENT_ID, realm: REALM_ID });

            expect(mapper.interfaceClientPayload({ entities: [first, second], isRevoked: true, actor: ACTOR_ID })).toEqual([
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { isRevoked: true, id: FIRST_CLIENT_ID },
                },
                {
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    input: { isRevoked: true, id: SECOND_CLIENT_ID },
                },
            ]);
        });
    });
});
