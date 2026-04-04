import { Migration } from '@mikro-orm/migrations';

export class Migration20260404170519_remove_passwordless_login_flag extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."identifier" drop column "allow_passwordless_login";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."identifier" add column "allow_passwordless_login" boolean not null;`);
  }

}
