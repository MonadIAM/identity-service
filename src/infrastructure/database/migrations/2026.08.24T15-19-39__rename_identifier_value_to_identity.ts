import { Migration } from '@mikro-orm/migrations';

export class Migration20260824151939_rename_identifier_value_to_identity extends Migration {

  override name = 'Migration20260824151939_rename_identifier_value_to_identity';

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_type_value_unique";`);
    this.addSql(`drop index "identity"."identifier_value_trgm_idx";`);
    this.addSql(`alter table "identity"."identifier" rename column "value" to "identity";`);
    this.addSql(`CREATE INDEX "identifier_identity_trgm_idx" ON "identity"."identifier" USING gin ("identity" gin_trgm_ops);`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_identity_unique" unique ("type", "identity");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "identity"."identifier_identity_trgm_idx";`);
    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_type_identity_unique";`);
    this.addSql(`alter table "identity"."identifier" rename column "identity" to "value";`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_value_unique" unique ("type", "value");`);
    this.addSql(`CREATE INDEX "identifier_value_trgm_idx" ON "identity"."identifier" USING gin ("value" gin_trgm_ops);`);
  }

}
