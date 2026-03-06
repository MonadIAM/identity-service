import { Migration } from '@mikro-orm/migrations';

export class Migration20260306084215_install_pg_trgm_extension extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }

}
