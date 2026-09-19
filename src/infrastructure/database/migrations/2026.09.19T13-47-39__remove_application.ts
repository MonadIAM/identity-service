import { Migration } from '@mikro-orm/migrations';

export class Migration20260919134739_remove_application extends Migration {

  override name = 'Migration20260919134739_remove_application';

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."interface_client" drop constraint "interface_client_application_id_foreign";`);
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_id_foreign";`);

    this.addSql(`drop table if exists "identity"."application" cascade;`);

    this.addSql(`drop index "identity"."interface_client_application_idx";`);
    this.addSql(`alter table "identity"."interface_client" drop constraint "interface_client_application_name_unique";`);
    this.addSql(`alter table "identity"."interface_client" drop column "application_id";`);
    this.addSql(`alter table "identity"."interface_client" add "realm" uuid not null;`);
    this.addSql(`alter table "identity"."interface_client" rename column "application_version" to "realm_version";`);
    this.addSql(`alter table "identity"."interface_client" rename column "is_application_revoked" to "is_realm_revoked";`);
    this.addSql(`create index "interface_client_realm_idx" on "identity"."interface_client" ("realm");`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_realm_name_unique" unique ("realm", "name");`);

    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_code_unique";`);
    this.addSql(`drop index "identity"."service_client_application_idx";`);
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_name_unique";`);
    this.addSql(`alter table "identity"."service_client" drop column "application_id";`);
    this.addSql(`alter table "identity"."service_client" add "realm" uuid not null;`);
    this.addSql(`alter table "identity"."service_client" rename column "application_version" to "realm_version";`);
    this.addSql(`alter table "identity"."service_client" rename column "is_application_revoked" to "is_realm_revoked";`);
    this.addSql(`create index "service_client_realm_idx" on "identity"."service_client" ("realm");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_realm_name_unique" unique ("realm", "name");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_realm_code_unique" unique ("realm", "code");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`create table "identity"."application" ("created_at" timestamptz(3) not null, "description" text null, "id" uuid not null, "is_realm_revoked" boolean not null, "is_revoked" boolean not null, "is_system_managed" boolean not null, "name" text not null, "realm" uuid not null, "realm_version" int not null, "updated_at" timestamptz(3) null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "application_realm_idx" on "identity"."application" ("realm");`);
    this.addSql(`alter table "identity"."application" add constraint "application_realm_name_unique" unique ("realm", "name");`);

    this.addSql(`drop index "identity"."interface_client_realm_idx";`);
    this.addSql(`alter table "identity"."interface_client" drop constraint "interface_client_realm_name_unique";`);
    this.addSql(`alter table "identity"."interface_client" drop column "realm";`);
    this.addSql(`alter table "identity"."interface_client" add "application_id" uuid not null;`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."interface_client" rename column "realm_version" to "application_version";`);
    this.addSql(`alter table "identity"."interface_client" rename column "is_realm_revoked" to "is_application_revoked";`);
    this.addSql(`create index "interface_client_application_idx" on "identity"."interface_client" ("application_id");`);
    this.addSql(`alter table "identity"."interface_client" add constraint "interface_client_application_name_unique" unique ("application_id", "name");`);

    this.addSql(`drop index "identity"."service_client_realm_idx";`);
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_realm_name_unique";`);
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_realm_code_unique";`);
    this.addSql(`alter table "identity"."service_client" drop column "realm";`);
    this.addSql(`alter table "identity"."service_client" add "application_id" uuid not null;`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_id_foreign" foreign key ("application_id") references "identity"."application" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."service_client" rename column "realm_version" to "application_version";`);
    this.addSql(`alter table "identity"."service_client" rename column "is_realm_revoked" to "is_application_revoked";`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_code_unique" unique ("application_id", "code");`);
    this.addSql(`create index "service_client_application_idx" on "identity"."service_client" ("application_id");`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_name_unique" unique ("application_id", "name");`);
  }

}
