import { Migration } from '@mikro-orm/migrations';

export class Migration20260405105832_remove_second_factor_status_model extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."second_factor" drop column "status", drop column "revoked_at";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."second_factor" add column "status" text check ("status" in ('PENDING', 'ACTIVE', 'REVOKED')) not null, add column "revoked_at" timestamptz(3) null;`);
  }

}
