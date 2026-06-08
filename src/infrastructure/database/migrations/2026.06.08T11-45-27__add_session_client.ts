import { Migration } from '@mikro-orm/migrations';

export class Migration20260608114527_add_session_client extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "identity"."membership" ("account_id" uuid not null, "realm_id" uuid not null, "invited_by" uuid not null, "created_at" timestamptz(3) not null, "joined_at" timestamptz(3) not null, constraint "membership_pkey" primary key ("account_id", "realm_id"));`);

    this.addSql(`alter table "identity"."membership" add constraint "membership_account_id_foreign" foreign key ("account_id") references "identity"."account" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "identity"."session" add column "client" text not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "identity"."membership" cascade;`);

    this.addSql(`alter table "identity"."session" drop column "client";`);
  }

}
