import { Migration } from '@mikro-orm/migrations';

export class Migration20260802153841_drop_identifier_receive_notifications_column extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."identifier" drop column "receive_notifications";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."identifier" add "receive_notifications" boolean not null;`);
  }

}
