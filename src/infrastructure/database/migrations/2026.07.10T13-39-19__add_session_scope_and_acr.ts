import { Migration } from '@mikro-orm/migrations';

export class Migration20260710133919_add_session_scope_and_acr extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."session" add column "scope" text not null, add column "acr" text not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."session" drop column "scope", drop column "acr";`);
  }

}
