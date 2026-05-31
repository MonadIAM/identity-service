import { Migration } from '@mikro-orm/migrations';

export class Migration20260531044305_squash_identity_schema extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    this.addSql(`create schema if not exists "identity";`);
    this.addSql(`create schema if not exists "system";`);
    this.addSql(`create table "identity"."account" ("id" uuid not null, "subject" text check ("subject" in ('SERVICE', 'SYSTEM', 'HUMAN')) not null, "status" text check ("status" in ('DEACTIVATED', 'SUSPENDED', 'PENDING', 'ACTIVE')) not null, "is2faenforced" boolean not null, "last_active_at" timestamptz(3) null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null, constraint "account_pkey" primary key ("id"));`);

    this.addSql(`create table "system"."audit_log" ("id" uuid not null, "action_type" varchar(64) not null, "entity_type" varchar(64) not null, "actor" uuid null, "ip" varchar(45) null, "user_agent" text null, "input" jsonb null, "created_at" timestamptz(3) not null, constraint "audit_log_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_log_actor_created_at_idx" on "system"."audit_log" ("actor", "created_at");`);
    this.addSql(`create index "audit_log_entity_type_action_type_idx" on "system"."audit_log" ("entity_type", "action_type");`);

    this.addSql(`create table "system"."change_log" ("id" uuid not null, "audit_entry_id" uuid not null, "change_type" varchar(16) not null, "entity_type" varchar(64) not null, "entity" uuid not null, "delta" jsonb not null, "created_at" timestamptz(3) not null, constraint "change_log_pkey" primary key ("id"));`);
    this.addSql(`create index "change_log_audit_entry_idx" on "system"."change_log" ("audit_entry_id");`);
    this.addSql(`create index "change_log_entity_type_entity_id_idx" on "system"."change_log" ("entity_type", "entity");`);

    this.addSql(`create table "identity"."identifier" ("id" uuid not null, "type" text check ("type" in ('email', 'phone', 'oauth')) not null, "value" text not null, "provider" text null, "provider_user_id" text null, "is_verified" boolean not null, "is_public_contact" boolean not null, "receive_notifications" boolean not null, "account_id" uuid not null, "verified_at" timestamptz(3) null, "last_used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "identifier_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX "identifier_value_trgm_idx" ON "identity"."identifier" USING gin ("value" gin_trgm_ops);`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_value_unique" unique ("type", "value");`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_provider_provider_user_id_unique" unique ("provider", "provider_user_id");`);

    this.addSql(`create table "identity"."master_code" ("account_id" uuid not null, "hash" text not null, "created_at" timestamptz(3) not null, constraint "master_code_pkey" primary key ("account_id"));`);

    this.addSql(`create table "system"."outbox" ("id" uuid not null, "sequence_number" bigserial, "event_type" varchar(64) not null, "aggregate_type" varchar(64) not null, "destination_topic" varchar(128) not null, "payload" jsonb not null, "metadata" jsonb null, "created_at" timestamptz(3) not null, constraint "outbox_pkey" primary key ("id"));`);
    this.addSql(`create index "outbox_sequence_number_idx" on "system"."outbox" ("sequence_number");`);
    this.addSql(`create index "outbox_aggregate_idx" on "system"."outbox" ("aggregate_type");`);

    this.addSql(`create table "identity"."password" ("account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, constraint "password_pkey" primary key ("account_id"));`);

    this.addSql(`create table "identity"."password_history" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, constraint "password_history_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_version_unique" unique ("account_id", "version");`);

    this.addSql(`create table "identity"."profile" ("account_id" uuid not null, "display_name" varchar(255) not null, "locale" varchar(16) null, "time_zone" varchar(64) null, "picture_url" text null, "updated_at" timestamptz(3) null, constraint "profile_pkey" primary key ("account_id"));`);
    this.addSql(`CREATE INDEX "profile_display_name_trgm_idx" ON "identity"."profile" USING gin ("display_name" gin_trgm_ops);`);

    this.addSql(`create table "identity"."recovery_code" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "recovery_code_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_hash_unique" unique ("account_id", "hash");`);

    this.addSql(`create table "identity"."second_factor" ("id" uuid not null, "account_id" uuid not null, "type" text check ("type" in ('totp')) not null, "secret" text not null, "name" varchar(128) null, "confirmed_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "second_factor_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_type_unique" unique ("account_id", "type");`);

    this.addSql(`create table "identity"."session" ("id" uuid not null, "account_id" uuid not null, "refresh_token_hash" text not null, "ip" inet not null, "user_agent" text not null, "expires_at" timestamptz(3) not null, "created_at" timestamptz(3) not null, "last_refreshed_at" timestamptz(3) not null, constraint "session_pkey" primary key ("id"));`);

    this.addSql(`alter table "identity"."identifier" add constraint "identifier_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."master_code" add constraint "master_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."password" add constraint "password_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."profile" add constraint "profile_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."session" add constraint "session_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);

    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_account_id_foreign";`);

    this.addSql(`alter table "identity"."master_code" drop constraint "master_code_account_id_foreign";`);

    this.addSql(`alter table "identity"."password" drop constraint "password_account_id_foreign";`);

    this.addSql(`alter table "identity"."password_history" drop constraint "password_history_account_id_foreign";`);

    this.addSql(`alter table "identity"."profile" drop constraint "profile_account_id_foreign";`);

    this.addSql(`alter table "identity"."recovery_code" drop constraint "recovery_code_account_id_foreign";`);

    this.addSql(`alter table "identity"."second_factor" drop constraint "second_factor_account_id_foreign";`);

    this.addSql(`alter table "identity"."session" drop constraint "session_account_id_foreign";`);

    this.addSql(`drop table if exists "identity"."account" cascade;`);

    this.addSql(`drop table if exists "system"."audit_log" cascade;`);

    this.addSql(`drop table if exists "system"."change_log" cascade;`);

    this.addSql(`drop table if exists "identity"."identifier" cascade;`);

    this.addSql(`drop table if exists "identity"."master_code" cascade;`);

    this.addSql(`drop table if exists "system"."outbox" cascade;`);

    this.addSql(`drop table if exists "identity"."password" cascade;`);

    this.addSql(`drop table if exists "identity"."password_history" cascade;`);

    this.addSql(`drop table if exists "identity"."profile" cascade;`);

    this.addSql(`drop table if exists "identity"."recovery_code" cascade;`);

    this.addSql(`drop table if exists "identity"."second_factor" cascade;`);

    this.addSql(`drop table if exists "identity"."session" cascade;`);

    this.addSql(`drop schema if exists "identity";`);
    this.addSql(`drop schema if exists "system";`);
  }

}
