import { Migration } from '@mikro-orm/migrations';

export class Migration20260404093739_update_audit_log_schema extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop table if exists "identity"."notification" cascade;`);

    this.addSql(`drop index "tracking"."audit_log_realm_idx";`);
    this.addSql(`alter table "tracking"."audit_log" drop column "realm";`);

    this.addSql(`alter table "tracking"."audit_log" alter column "actor" drop default;`);
    this.addSql(`alter table "tracking"."audit_log" alter column "actor" type uuid using ("actor"::text::uuid);`);
    this.addSql(`alter table "tracking"."audit_log" alter column "actor" drop not null;`);

    this.addSql(`alter table "identity"."second_factor" drop constraint "second_factor_account_type_unique";`);

    this.addSql(`alter table "identity"."second_factor" add column "status" text check ("status" in ('PENDING', 'ACTIVE', 'REVOKED')) not null, add column "revoked_at" timestamptz(3) null;`);
    this.addSql(`CREATE UNIQUE INDEX "second_factor_account_type_active_unique" ON "identity"."second_factor" ("account_id", "type") WHERE "status" != 'REVOKED';`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "identity"."notification" ("id" uuid not null, "account_id" uuid not null, "source" varchar(64) not null, "category" text check ("category" in ('security', 'account', 'access', 'system')) not null, "title" varchar(255) not null, "body" text not null, "read_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "notification_pkey" primary key ("id"));`);

    this.addSql(`alter table "identity"."notification" add constraint "notification_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "tracking"."audit_log" add column "realm" uuid null;`);
    this.addSql(`alter table "tracking"."audit_log" alter column "actor" drop default;`);
    this.addSql(`alter table "tracking"."audit_log" alter column "actor" type uuid using ("actor"::text::uuid);`);
    this.addSql(`alter table "tracking"."audit_log" alter column "actor" set not null;`);
    this.addSql(`create index "audit_log_realm_idx" on "tracking"."audit_log" ("realm");`);

    this.addSql(`drop index "identity"."second_factor_account_type_active_unique";`);
    this.addSql(`alter table "identity"."second_factor" drop column "status", drop column "revoked_at";`);

    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_type_unique" unique ("account_id", "type");`);
  }

}
