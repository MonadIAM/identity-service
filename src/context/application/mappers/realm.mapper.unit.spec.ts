import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/unit/entity-factory.registry";

import { RealmMapper } from "./realm.mapper";

const ACTOR = "00000000-0000-4000-8000-000000000001";
const REALM = "00000000-0000-4000-8000-000000000002";

const mapper = new RealmMapper();
const helpers = new EntityFactoryRegistry();

describe("RealmMapper", () => {
    it("keeps manually revoked interface clients blocked when the realm is restored", () => {
        const manual = helpers.createInterfaceClient({ realm: REALM, isRevoked: true });
        const active = helpers.createInterfaceClient({ realm: REALM });

        const payloads = mapper.interfaceClientPayload({
            interfaceClients: [manual, active],
            serviceClients: [],
            isRevoked: false,
            actor: ACTOR,
        });

        expect(payloads).toEqual([
            { realm: REALM, actor: ACTOR, input: { id: manual.id, isRevoked: true } },
            { realm: REALM, actor: ACTOR, input: { id: active.id, isRevoked: false } },
        ]);
    });

    it("does not publish service-client restoration for manually revoked clients", () => {
        const manual = helpers.createServiceClient({ realm: REALM, isRevoked: true });
        const active = helpers.createServiceClient({ realm: REALM });

        const payloads = mapper.serviceClientPayload({
            interfaceClients: [],
            serviceClients: [manual, active],
            isRevoked: false,
            actor: ACTOR,
        });

        expect(payloads).toEqual([{ realm: REALM, actor: ACTOR, input: { id: active.id, code: active.code } }]);
    });

    it("includes both active and manually revoked service clients for revocation or purge", () => {
        const manual = helpers.createServiceClient({ realm: REALM, isRevoked: true });
        const active = helpers.createServiceClient({ realm: REALM });

        const payloads = mapper.serviceClientPayload({
            interfaceClients: [],
            serviceClients: [manual, active],
            isRevoked: true,
            actor: ACTOR,
        });

        expect(payloads).toEqual([
            { realm: REALM, actor: ACTOR, input: { id: manual.id, code: manual.code } },
            { realm: REALM, actor: ACTOR, input: { id: active.id, code: active.code } },
        ]);
    });

    it("emits no client events when no rows were affected", () => {
        const props = { interfaceClients: [], serviceClients: [], isRevoked: true, actor: ACTOR };

        const interfaces = mapper.interfaceClientPayload(props);
        const services = mapper.serviceClientPayload(props);

        expect(interfaces).toEqual([]);
        expect(services).toEqual([]);
    });
});
