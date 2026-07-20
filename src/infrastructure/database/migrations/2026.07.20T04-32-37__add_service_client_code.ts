import { Migration } from '@mikro-orm/migrations';

export class Migration20260720043237_add_service_client_code extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."service_client" add column "code" varchar(128) not null;`);
    this.addSql(`alter table "identity"."service_client" add constraint "service_client_application_code_unique" unique ("application_id", "code");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."service_client" drop constraint "service_client_application_code_unique";`);
    this.addSql(`alter table "identity"."service_client" drop column "code";`);
  }

}
