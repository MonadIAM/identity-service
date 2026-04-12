import { Migration } from '@mikro-orm/migrations';

export class Migration20260411174148_rename_sessions_last_active_at_column extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."session" rename column "last_active_at" to "last_refreshed_at";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."session" rename column "last_refreshed_at" to "last_active_at";`);
  }

}
