import { Migration } from '@mikro-orm/migrations';

export class Migration20260811000717_add_invite extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create type "identity"."invite_status" as enum ('CANCELLED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'INVALIDATED', 'PENDING');`);
    this.addSql(`create table "identity"."invite" ("id" uuid not null, "status" "identity"."invite_status" not null, "invitee_id" uuid not null, "inviter_id" uuid not null, "realm_id" uuid not null, "role_id" uuid not null, "updated_at" timestamptz(3) null, "created_at" timestamptz(3) not null, "version" int not null default 1, primary key ("id"));`);
    this.addSql(`create index "invite_invitee_idx" on "identity"."invite" ("invitee_id");`);
    this.addSql(`create index "invite_inviter_idx" on "identity"."invite" ("inviter_id");`);
    this.addSql(`create index "invite_realm_idx" on "identity"."invite" ("realm_id");`);
    this.addSql(`CREATE UNIQUE INDEX "invite_realm_invitee_pending_unique" ON "identity"."invite" ("realm_id", "invitee_id") WHERE "status" = 'PENDING';`);

    this.addSql(`alter table "identity"."invite" add constraint "invite_invitee_id_foreign" foreign key ("invitee_id") references "identity"."account" ("id") on delete cascade;`);
    this.addSql(`alter table "identity"."invite" add constraint "invite_inviter_id_foreign" foreign key ("inviter_id") references "identity"."account" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "identity"."invite" cascade;`);

    this.addSql(`drop type "identity"."invite_status";`);
  }

}
