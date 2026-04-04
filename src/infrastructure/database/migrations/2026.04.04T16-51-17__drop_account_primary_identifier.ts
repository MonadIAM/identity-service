import { Migration } from '@mikro-orm/migrations';

export class Migration20260404165117_drop_account_primary_identifier extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_unique";`);
    this.addSql(`alter table "identity"."account" drop column "primary_identifier_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."account" add column "primary_identifier_id" uuid null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_unique" unique ("primary_identifier_id");`);
  }

}
