import { Migration } from '@mikro-orm/migrations';

export class Migration20260502204321_add_last_active_at_to_account extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."account" add column "last_active_at" timestamptz(3) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."account" drop column "last_active_at";`);
  }

}
