import { Migration } from '@mikro-orm/migrations';

export class Migration20260814123441_add_audit_log_realm_column extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" add "realm" uuid null;`);
    this.addSql(`create index "audit_log_realm_idx" on "system"."audit_log" ("realm");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "system"."audit_log_realm_idx";`);
    this.addSql(`alter table "system"."audit_log" drop column "realm";`);
  }

}
