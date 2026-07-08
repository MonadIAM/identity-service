import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import { InterfaceClients, RecoveryCodes, Applications, Identifiers, Passwords, Accounts, Profiles } from "../datasets";

export class SystemSeeder extends Seeder {
    public async run(entityManager: EntityManager): Promise<void> {
        await entityManager.getConnection().execute(`
            TRUNCATE TABLE
                identity.interface_client,
                identity.service_client,
                identity.application,
                identity.account,
                identity.identifier,
                identity.master_code,
                identity.password_history,
                identity.password,
                identity.profile,
                identity.recovery_code,
                identity.second_factor,
                identity.session
            RESTART IDENTITY CASCADE
        `);

        await entityManager.insertMany("identity.account", Accounts);
        await entityManager.insertMany("identity.profile", Profiles);
        await entityManager.insertMany("identity.password", Passwords);
        await entityManager.insertMany("identity.identifier", Identifiers);
        await entityManager.insertMany("identity.application", Applications);
        await entityManager.insertMany("identity.interface_client", InterfaceClients);
        await entityManager.insertMany("identity.recovery_code", RecoveryCodes);
    }
}
