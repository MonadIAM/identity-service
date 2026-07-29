import { Migration } from '@mikro-orm/migrations';

export class Migration20260729203807_add_identifier_account_id_idx extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create index "identifier_account_id_idx" on "identity"."identifier" ("account_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "identity"."identifier_account_id_idx";`);
  }

}
