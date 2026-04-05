import { Migration } from '@mikro-orm/migrations';

export class Migration20260405112719_add_public_contact_flag_to_identifier extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."identifier" add column "is_public_contact" boolean not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."identifier" drop column "is_public_contact";`);
  }

}
