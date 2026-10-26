import { Seeder } from "@mikro-orm/seeder";

export class System extends Seeder {
    private readonly schema: string = "identity";

    public async run(entityManager: ORM.EntityManager): Promise<void> {
        const { dataset } = await import("@monadiam/shared/datasets/system/identity");
        const platform = entityManager.getPlatform();
        const seedOrder = [
            dataset.Accounts,
            dataset.Profiles,
            dataset.Passwords,
            dataset.Identifiers,
            dataset.InterfaceClients,
            dataset.ServiceClients,
            dataset.RecoveryCodes,
            dataset.SecondFactors,
            dataset.PasswordHistory,
            dataset.MasterCodes,
            dataset.Sessions,
        ].filter((table) => table.postgresql.length > 0);

        await entityManager.transactional(async (manager) => {
            await manager.execute(`
                TRUNCATE TABLE
                    identity.account,
                    identity.profile,
                    identity.password,
                    identity.identifier,
                    identity.interface_client,
                    identity.service_client,
                    identity.recovery_code,
                    identity.second_factor,
                    identity.password_history,
                    identity.master_code,
                    identity.session,
                    system.outbox,
                    system.change_log,
                    system.audit_log
                RESTART IDENTITY CASCADE
            `);

            for await (const entry of seedOrder) {
                const query = platform
                    .createNativeQueryBuilder()
                    .into(`${this.schema}.${entry.name}`)
                    .insert(entry.postgresql);
                await manager.execute(query, [], "run");
            }
        });
    }
}
