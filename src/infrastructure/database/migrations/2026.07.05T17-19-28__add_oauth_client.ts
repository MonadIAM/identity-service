import { Migration } from '@mikro-orm/migrations';

export class Migration20260705171928_add_oauth_client extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "identity"."oauth_client" ("id" uuid not null, "realm" uuid not null, "name" varchar(255) not null, "description" text null, "redirect_uri" text not null, "grant_types" text[] not null, "realm_version" int not null, "is_system_managed" boolean not null, "is_realm_revoked" boolean not null, "is_revoked" boolean not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, constraint "oauth_client_pkey" primary key ("id"));`);
    this.addSql(`create index "oauth_client_realm_idx" on "identity"."oauth_client" ("realm");`);
    this.addSql(`alter table "identity"."oauth_client" add constraint "oauth_client_realm_name_unique" unique ("realm", "name");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "identity"."oauth_client" cascade;`);
  }

}
