import { Migration } from '@mikro-orm/migrations';

export class Migration20260918191404_drop_legacy_invite_and_membership_tables extends Migration {

  override name = 'Migration20260918191404_drop_legacy_invite_and_membership_tables';

  override up(): void | Promise<void> {
    this.addSql(`drop table if exists "identity"."invite" cascade;`);
    this.addSql(`drop table if exists "identity"."membership" cascade;`);
    this.addSql(`drop table if exists "identity"."membership_history" cascade;`);

    this.addSql(`drop type "identity"."invite_status";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`create type "identity"."invite_status" as enum ('INVALIDATED', 'CANCELLED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'PENDING');`);
    this.addSql(`create table "identity"."invite" ("created_at" timestamptz(3) not null, "id" uuid not null, "invitee_id" uuid not null, "inviter_id" uuid not null, "realm_id" uuid not null, "role_id" uuid not null, "status" "identity"."invite_status" not null, "updated_at" timestamptz(3) null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "invite_invitee_idx" on "identity"."invite" ("invitee_id");`);
    this.addSql(`create index "invite_inviter_idx" on "identity"."invite" ("inviter_id");`);
    this.addSql(`create index "invite_realm_idx" on "identity"."invite" ("realm_id");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_pending_unique" ON "identity"."invite" ("realm_id", "invitee_id") WHERE "status" = 'PENDING';`);

    this.addSql(`create table "identity"."membership" ("account_id" uuid not null, "created_at" timestamptz(3) not null, "invited_by" uuid not null, "joined_at" timestamptz(3) not null, "realm_id" uuid not null, primary key ("account_id", "realm_id"));`);

    this.addSql(`create table "identity"."membership_history" ("account_id" uuid not null, "created_at" timestamptz(3) not null, "excluded_by" uuid null, "id" uuid not null, "invited_by" uuid not null, "joined_at" timestamptz(3) not null, "leave_at" timestamptz(3) null, "realm_id" uuid not null, primary key ("id"));`);
    this.addSql(`create index "membership_history_account_idx" on "identity"."membership_history" ("account_id");`);
    this.addSql(`CREATE UNIQUE INDEX "membership_history_account_realm_open_unique" ON "identity"."membership_history" ("account_id", "realm_id") WHERE "leave_at" IS NULL;`);
    this.addSql(`create index "membership_history_realm_idx" on "identity"."membership_history" ("realm_id");`);

    this.addSql(`alter table "identity"."invite" add constraint "invite_invitee_id_foreign" foreign key ("invitee_id") references "identity"."account" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."invite" add constraint "invite_inviter_id_foreign" foreign key ("inviter_id") references "identity"."account" ("id") on delete cascade;`);

    this.addSql(`alter table "identity"."membership" add constraint "membership_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);
  }

}
