import { Migration } from '@mikro-orm/migrations';

export class Migration20260812053144_add_membership_history extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "identity"."membership_history" ("id" uuid not null, "realm_id" uuid not null, "account_id" uuid not null, "invited_by" uuid not null, "excluded_by" uuid null, "joined_at" timestamptz(3) not null, "leave_at" timestamptz(3) null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "membership_history_account_idx" on "identity"."membership_history" ("account_id");`);
    this.addSql(`create index "membership_history_realm_idx" on "identity"."membership_history" ("realm_id");`);
    this.addSql(`CREATE UNIQUE INDEX "membership_history_account_realm_open_unique" ON "identity"."membership_history" ("account_id", "realm_id") WHERE "leave_at" IS NULL;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "identity"."membership_history" cascade;`);
  }

}
