import { Migration } from '@mikro-orm/migrations';

export class Migration20260904155120_interface_client_multiple_redirect_uris extends Migration {

  override name = 'Migration20260904155120_interface_client_multiple_redirect_uris';

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."interface_client" drop column "redirect_uri";`);
    this.addSql(`alter table "identity"."interface_client" add "redirect_uris" text[] not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."interface_client" drop column "redirect_uris";`);
    this.addSql(`alter table "identity"."interface_client" add "redirect_uri" text not null;`);
  }

}
