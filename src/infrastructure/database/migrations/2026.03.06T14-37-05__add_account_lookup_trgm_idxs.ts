import { Migration } from '@mikro-orm/migrations';

export class Migration20260306143705_add_account_lookup_trgm_idxs extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX "identifier_value_trgm_idx" ON "identity"."identifier" USING gin ("value" gin_trgm_ops);`);

    this.addSql(`CREATE INDEX "profile_display_name_trgm_idx" ON "identity"."profile" USING gin ("display_name" gin_trgm_ops);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "identity"."identifier_value_trgm_idx";`);

    this.addSql(`drop index "identity"."profile_display_name_trgm_idx";`);
  }

}
