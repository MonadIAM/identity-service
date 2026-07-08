import { Migration } from '@mikro-orm/migrations';

export class Migration20260708201710_add_session_realms extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."session" add column "realms" text[] not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."session" drop column "realms";`);
  }

}
