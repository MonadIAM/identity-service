import { Migration } from '@mikro-orm/migrations';

export class Migration20260728192408_squash_identity_schema extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    this.addSql(`create schema if not exists "identity";`);
    this.addSql(`create schema if not exists "system";`);
    this.addSql(`create table "identity"."account" ("id" uuid not null, "subject" text not null, "status" text not null, "is2faenforced" boolean not null, "last_active_at" timestamptz(3) null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null, primary key ("id"));`);

    this.addSql(`create table "identity"."application" ("id" uuid not null, "realm" uuid not null, "name" varchar(255) not null, "description" text null, "realm_version" int not null, "is_system_managed" boolean not null, "is_realm_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "application_realm_idx" on "identity"."application" ("realm");`);
    this.addSql(`alter table "identity"."application" add constraint "application_realm_name_unique" unique ("realm", "name");`);

    this.addSql(`create table "system"."audit_log" ("id" uuid not null, "action_type" varchar(64) not null, "entity_type" varchar(64) not null, "actor" uuid null, "ip" varchar(45) null, "user_agent" text null, "input" jsonb null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "audit_log_actor_created_at_idx" on "system"."audit_log" ("actor", "created_at");`);
    this.addSql(`create index "audit_log_entity_type_action_type_idx" on "system"."audit_log" ("entity_type", "action_type");`);

    this.addSql(`create table "system"."change_log" ("id" uuid not null, "audit_entry_id" uuid not null, "change_type" varchar(16) not null, "entity_type" varchar(64) not null, "entity" uuid not null, "delta" jsonb not null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "change_log_audit_entry_idx" on "system"."change_log" ("audit_entry_id");`);
    this.addSql(`create index "change_log_entity_type_entity_id_idx" on "system"."change_log" ("entity_type", "entity");`);

    this.addSql(`create table "identity"."identifier" ("id" uuid not null, "type" text not null, "value" text not null, "provider" text null, "provider_user_id" text null, "is_verified" boolean not null, "is_public_contact" boolean not null, "receive_notifications" boolean not null, "account_id" uuid not null, "verified_at" timestamptz(3) null, "last_used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`CREATE INDEX "identifier_value_trgm_idx" ON "identity"."identifier" USING gin ("value" gin_trgm_ops);`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_value_unique" unique ("type", "value");`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_provider_provider_user_id_unique" unique ("provider", "provider_user_id");`);

    this.addSql(`create table "identity"."interface_client" ("id" uuid not null, "application_id" uuid not null, "name" varchar(255) not null, "description" text null, "redirect_uri" text not null, "auth_address" text not null, "grant_types" text[] not null, "application_version" int not null, "is_system_managed" boolean not null, "is_application_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "interface_client_application_idx" on "identity"."interface_client" ("application_id");`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_name_unique" unique ("application_id", "name");`);

    this.addSql(`create table "identity"."master_code" ("account_id" uuid not null, "hash" text not null, "created_at" timestamptz(3) not null, primary key ("account_id"));`);

    this.addSql(`create table "identity"."membership" ("account_id" uuid not null, "realm_id" uuid not null, "invited_by" uuid not null, "created_at" timestamptz(3) not null, "joined_at" timestamptz(3) not null, primary key ("account_id", "realm_id"));`);

    this.addSql(`create table "system"."outbox" ("id" uuid not null, "sequence_number" bigserial, "action_type" varchar(64) not null, "destination_topic" varchar(128) not null, "payload" jsonb not null, "metadata" jsonb null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`create index "outbox_sequence_number_idx" on "system"."outbox" ("sequence_number");`);

    this.addSql(`create table "identity"."password" ("account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, primary key ("account_id"));`);

    this.addSql(`create table "identity"."password_history" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_version_unique" unique ("account_id", "version");`);

    this.addSql(`create table "identity"."profile" ("account_id" uuid not null, "display_name" varchar(255) not null, "locale" varchar(16) null, "time_zone" varchar(64) null, "picture_url" text null, "updated_at" timestamptz(3) null, primary key ("account_id"));`);
    this.addSql(`CREATE INDEX "profile_display_name_trgm_idx" ON "identity"."profile" USING gin ("display_name" gin_trgm_ops);`);

    this.addSql(`create table "identity"."recovery_code" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_hash_unique" unique ("account_id", "hash");`);

    this.addSql(`create table "identity"."second_factor" ("id" uuid not null, "account_id" uuid not null, "type" text not null, "secret" text not null, "name" varchar(128) null, "confirmed_at" timestamptz(3) null, "created_at" timestamptz(3) not null, primary key ("id"));`);
    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_type_unique" unique ("account_id", "type");`);

    this.addSql(`create table "identity"."service_client" ("id" uuid not null, "application_id" uuid not null, "code" varchar(128) not null, "name" varchar(255) not null, "description" text null, "allowed_addresses" text[] not null, "application_version" int not null, "is_system_managed" boolean not null, "is_application_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "service_client_application_idx" on "identity"."service_client" ("application_id");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_name_unique" unique ("application_id", "name");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_code_unique" unique ("application_id", "code");`);

    this.addSql(`create table "identity"."session" ("id" uuid not null, "account_id" uuid not null, "realms" text[] not null, "ip" inet not null, "refresh_token_hash" text not null, "user_agent" text not null, "client" text not null, "scope" text not null, "acr" text not null, "expires_at" timestamptz(3) not null, "created_at" timestamptz(3) not null, "last_refreshed_at" timestamptz(3) not null, primary key ("id"));`);

    this.addSql(`alter table "identity"."account" add constraint "account_subject_check" check ("subject" in ('SERVICE', 'SYSTEM', 'HUMAN'));`);
    this.addSql(`alter table "identity"."account" add constraint "account_status_check" check ("status" in ('DEACTIVATED', 'SUSPENDED', 'PENDING', 'ACTIVE'));`);

    this.addSql(`alter table "identity"."identifier" add constraint "identifier_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_check" check ("type" in ('email', 'phone', 'oauth'));`);

    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_grant_types_check" check ("grant_types" <@ array['authorization_code'::text, 'refresh_token'::text]);`);

    this.addSql(`alter table "identity"."master_code" add constraint "master_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."membership" add constraint "membership_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);

    this.addSql(`alter table "identity"."password" add constraint "password_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);

    this.addSql(`alter table "identity"."profile" add constraint "profile_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);

    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_type_check" check ("type" in ('totp'));`);

    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on delete cascade;`);

    this.addSql(`alter table "identity"."session" add constraint "session_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`DROP EXTENSION IF EXISTS pg_trgm;`);

    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_account_id_foreign";`);
    this.addSql(`alter table "identity"."master_code" drop constraint "master_code_account_id_foreign";`);
    this.addSql(`alter table "identity"."membership" drop constraint "membership_account_id_foreign";`);
    this.addSql(`alter table "identity"."password" drop constraint "password_account_id_foreign";`);
    this.addSql(`alter table "identity"."password_history" drop constraint "password_history_account_id_foreign";`);
    this.addSql(`alter table "identity"."profile" drop constraint "profile_account_id_foreign";`);
    this.addSql(`alter table "identity"."recovery_code" drop constraint "recovery_code_account_id_foreign";`);
    this.addSql(`alter table "identity"."second_factor" drop constraint "second_factor_account_id_foreign";`);
    this.addSql(`alter table "identity"."session" drop constraint "session_account_id_foreign";`);
    this.addSql(`alter table "identity"."interface_client" drop constraint "interface_client_application_id_foreign";`);
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_id_foreign";`);

    this.addSql(`drop table if exists "identity"."account" cascade;`);
    this.addSql(`drop table if exists "identity"."application" cascade;`);
    this.addSql(`drop table if exists "system"."audit_log" cascade;`);
    this.addSql(`drop table if exists "system"."change_log" cascade;`);
    this.addSql(`drop table if exists "identity"."identifier" cascade;`);
    this.addSql(`drop table if exists "identity"."interface_client" cascade;`);
    this.addSql(`drop table if exists "identity"."master_code" cascade;`);
    this.addSql(`drop table if exists "identity"."membership" cascade;`);
    this.addSql(`drop table if exists "system"."outbox" cascade;`);
    this.addSql(`drop table if exists "identity"."password" cascade;`);
    this.addSql(`drop table if exists "identity"."password_history" cascade;`);
    this.addSql(`drop table if exists "identity"."profile" cascade;`);
    this.addSql(`drop table if exists "identity"."recovery_code" cascade;`);
    this.addSql(`drop table if exists "identity"."second_factor" cascade;`);
    this.addSql(`drop table if exists "identity"."service_client" cascade;`);
    this.addSql(`drop table if exists "identity"."session" cascade;`);

    this.addSql(`drop schema if exists "identity";`);
    this.addSql(`drop schema if exists "system";`);
  }

}
