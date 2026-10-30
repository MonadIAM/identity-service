import { Migration } from '@mikro-orm/migrations';

export class Migration20261029172448_add_account_deactivated_at extends Migration {

  override name = 'Migration20261029172448_add_account_deactivated_at';

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."account" add column "deactivated_at" timestamptz(3) null;`);
    this.addSql(`update "identity"."account" set "deactivated_at" = now() where "status" = 'DEACTIVATED';`);
    this.addSql(`create index "account_deactivated_at_index" on "identity"."account" ("deactivated_at");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "identity"."account_deactivated_at_index";`);
    this.addSql(`alter table "identity"."account" drop column "deactivated_at";`);
  }

}
