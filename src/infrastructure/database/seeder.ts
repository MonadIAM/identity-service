import { Seeder } from "@mikro-orm/seeder";

import datasets from "../datasets";

export class System extends Seeder {
    private readonly schema: string = "identity";

    public async run(entityManager: ORM.EntityManager): Promise<void> {
        const platform = entityManager.getPlatform();

        await entityManager.getConnection().execute(`
            TRUNCATE TABLE
                identity.interface_client,
                identity.service_client,
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

        const seedOrder = [
            datasets.Accounts,
            datasets.Profiles,
            datasets.Passwords,
            datasets.Identifiers,
            datasets.InterfaceClients,
            datasets.RecoveryCodes,
        ];

        for await (const dataset of seedOrder) {
            const query = platform
                .createNativeQueryBuilder()
                .into(`${this.schema}.${dataset.name}`)
                .insert(dataset.postgresql);
            await entityManager.execute(query, [], "run");
        }
    }
}
