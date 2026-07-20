import { Migration } from '@mikro-orm/migrations';

export class Migration20260720043309_drop_service_client_client_secret_hash extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."service_client" drop column "client_secret_hash";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."service_client" add column "client_secret_hash" text not null;`);
  }

}
