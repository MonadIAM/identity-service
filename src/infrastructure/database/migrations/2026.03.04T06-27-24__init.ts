import { Migration } from '@mikro-orm/migrations';

export class Migration20260304062724_init extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create schema if not exists "identity";`);
    this.addSql(`create table "identity"."account" ("id" uuid not null, "subject" text check ("subject" in ('SERVICE', 'SYSTEM', 'HUMAN')) not null, "status" text check ("status" in ('DEACTIVATED', 'SUSPENDED', 'PENDING', 'ACTIVE')) not null, "is2faenforced" boolean not null, "primary_identifier_id" uuid null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "account_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_unique" unique ("primary_identifier_id");`);

    this.addSql(`create table "identity"."identifier" ("id" uuid not null, "type" text check ("type" in ('email', 'phone', 'oauth')) not null, "value" text not null, "provider" text null, "provider_user_id" text null, "is_verified" boolean not null, "usable_as2fa" boolean not null, "receive_notifications" boolean not null, "account_id" uuid not null, "verified_at" timestamptz(3) null, "last_used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "identifier_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_value_unique" unique ("type", "value");`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_provider_provider_user_id_unique" unique ("provider", "provider_user_id");`);

    this.addSql(`create table "identity"."master_code" ("account_id" uuid not null, "hash" text not null, "created_at" timestamptz(3) not null, constraint "master_code_pkey" primary key ("account_id"));`);

    this.addSql(`create table "identity"."notification" ("id" uuid not null, "account_id" uuid not null, "source" varchar(64) not null, "category" text check ("category" in ('security', 'account', 'access', 'system')) not null, "type" varchar(128) not null, "title" varchar(255) not null, "body" text not null, "read_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "notification_pkey" primary key ("id"));`);

    this.addSql(`create table "identity"."password" ("account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, constraint "password_pkey" primary key ("account_id"));`);

    this.addSql(`create table "identity"."password_history" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "version" int not null, "set_at" timestamptz(3) not null, constraint "password_history_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_version_unique" unique ("account_id", "version");`);

    this.addSql(`create table "identity"."profile" ("account_id" uuid not null, "display_name" varchar(255) not null, "locale" varchar(16) null, "time_zone" varchar(64) null, "picture_url" text null, "updated_at" timestamptz(3) null, constraint "profile_pkey" primary key ("account_id"));`);

    this.addSql(`create table "identity"."recovery_code" ("id" uuid not null, "account_id" uuid not null, "hash" text not null, "used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "recovery_code_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_hash_unique" unique ("account_id", "hash");`);

    this.addSql(`create table "identity"."second_factor" ("id" uuid not null, "account_id" uuid not null, "type" text check ("type" in ('totp')) not null, "secret" text not null, "name" varchar(128) null, "is_preferred" boolean not null, "confirmed_at" timestamptz(3) null, "last_used_at" timestamptz(3) null, "created_at" timestamptz(3) not null, constraint "second_factor_pkey" primary key ("id"));`);
    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_type_unique" unique ("account_id", "type");`);

    this.addSql(`create table "identity"."session" ("id" uuid not null, "account_id" uuid not null, "refresh_token_hash" text not null, "ip" inet not null, "user_agent" text not null, "expires_at" timestamptz(3) not null, "last_active_at" timestamptz(3) not null, "created_at" timestamptz(3) not null, constraint "session_pkey" primary key ("id"));`);

    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "identity"."identifier" add constraint "identifier_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."master_code" add constraint "master_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."notification" add constraint "notification_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."password" add constraint "password_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."password_history" add constraint "password_history_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."profile" add constraint "profile_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."recovery_code" add constraint "recovery_code_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."session" add constraint "session_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_account_id_foreign";`);

    this.addSql(`alter table "identity"."master_code" drop constraint "master_code_account_id_foreign";`);

    this.addSql(`alter table "identity"."notification" drop constraint "notification_account_id_foreign";`);

    this.addSql(`alter table "identity"."password" drop constraint "password_account_id_foreign";`);

    this.addSql(`alter table "identity"."password_history" drop constraint "password_history_account_id_foreign";`);

    this.addSql(`alter table "identity"."profile" drop constraint "profile_account_id_foreign";`);

    this.addSql(`alter table "identity"."recovery_code" drop constraint "recovery_code_account_id_foreign";`);

    this.addSql(`alter table "identity"."second_factor" drop constraint "second_factor_account_id_foreign";`);

    this.addSql(`alter table "identity"."session" drop constraint "session_account_id_foreign";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`drop table if exists "identity"."account" cascade;`);

    this.addSql(`drop table if exists "identity"."identifier" cascade;`);

    this.addSql(`drop table if exists "identity"."master_code" cascade;`);

    this.addSql(`drop table if exists "identity"."notification" cascade;`);

    this.addSql(`drop table if exists "identity"."password" cascade;`);

    this.addSql(`drop table if exists "identity"."password_history" cascade;`);

    this.addSql(`drop table if exists "identity"."profile" cascade;`);

    this.addSql(`drop table if exists "identity"."recovery_code" cascade;`);

    this.addSql(`drop table if exists "identity"."second_factor" cascade;`);

    this.addSql(`drop table if exists "identity"."session" cascade;`);

    this.addSql(`drop schema if exists "identity";`);
  }

}
