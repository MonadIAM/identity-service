import { Migration } from '@mikro-orm/migrations';

export class Migration20260824171932_add_signature_and_key_version_to_log extends Migration {

  override name = 'Migration20260824171932_add_signature_and_key_version_to_log';

  override up(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" add "signature" text not null, add "key_version" int not null;`);

    this.addSql(`alter table "system"."change_log" add "signature" text not null, add "key_version" int not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "system"."audit_log" drop column "signature", drop column "key_version";`);

    this.addSql(`alter table "system"."change_log" drop column "signature", drop column "key_version";`);
  }

}
