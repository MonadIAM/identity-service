import { Migration } from '@mikro-orm/migrations';

export class Migration20260708194952_split_oauth_client_into_application_clients extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "identity"."application" ("id" uuid not null, "realm" uuid not null, "name" varchar(255) not null, "description" text null, "realm_version" int not null, "is_system_managed" boolean not null, "is_realm_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "application_pkey" primary key ("id"));`);
    this.addSql(`create index "application_realm_idx" on "identity"."application" ("realm");`);
    this.addSql(`alter table "identity"."application" add constraint "application_realm_name_unique" unique ("realm", "name");`);

    this.addSql(`create table "identity"."interface_client" ("id" uuid not null, "application_id" uuid not null, "name" varchar(255) not null, "description" text null, "redirect_uri" text not null, "auth_address" text not null, "grant_types" text[] not null, "application_version" int not null, "is_system_managed" boolean not null, "is_application_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "interface_client_pkey" primary key ("id"));`);
    this.addSql(`create index "interface_client_application_idx" on "identity"."interface_client" ("application_id");`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_name_unique" unique ("application_id", "name");`);

    this.addSql(`create table "identity"."service_client" ("id" uuid not null, "application_id" uuid not null, "name" varchar(255) not null, "description" text null, "client_secret_hash" text not null, "allowed_addresses" text[] not null, "application_version" int not null, "is_system_managed" boolean not null, "is_application_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "service_client_pkey" primary key ("id"));`);
    this.addSql(`create index "service_client_application_idx" on "identity"."service_client" ("application_id");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_name_unique" unique ("application_id", "name");`);

    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on update cascade on delete cascade;`);

    this.addSql(`drop table if exists "identity"."oauth_client" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."interface_client" drop constraint "interface_client_application_id_foreign";`);

    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_id_foreign";`);

    this.addSql(`create table "identity"."oauth_client" ("id" uuid not null, "realm" uuid not null, "name" varchar(255) not null, "description" text null, "redirect_uri" text not null, "grant_types" text[] not null, "realm_version" int not null, "is_system_managed" boolean not null, "is_realm_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "oauth_client_pkey" primary key ("id"));`);
    this.addSql(`create index "oauth_client_realm_idx" on "identity"."oauth_client" ("realm");`);
    this.addSql(`alter table "identity"."oauth_client" add constraint "oauth_client_realm_name_unique" unique ("realm", "name");`);

    this.addSql(`drop table if exists "identity"."application" cascade;`);

    this.addSql(`drop table if exists "identity"."interface_client" cascade;`);

    this.addSql(`drop table if exists "identity"."service_client" cascade;`);
  }

}
