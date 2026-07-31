import { Migration } from '@mikro-orm/migrations';

export class Migration20260731024234_rename_account_is_2fa_enforced_column extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."account" rename column "is2faenforced" to "is_2fa_enforced";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."account" rename column "is_2fa_enforced" to "is2faenforced";`);
  }

}
