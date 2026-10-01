import { dataset } from "@monadiam/shared/datasets/identity";
import { Seeder } from "@mikro-orm/seeder";

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
            dataset.Accounts,
            dataset.Profiles,
            dataset.Passwords,
            dataset.Identifiers,
            dataset.InterfaceClients,
            dataset.RecoveryCodes,
        ];

        for await (const entry of seedOrder) {
            const query = platform.createNativeQueryBuilder().into(`${this.schema}.${entry.name}`).insert(entry.postgresql);
            await entityManager.execute(query, [], "run");
        }
    }
}
