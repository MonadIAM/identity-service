import { Migration } from '@mikro-orm/migrations';

export class Migration20260906085039_add_last_accepted_totp_step_to_2fa extends Migration {

  override name = 'Migration20260906085039_add_last_accepted_totp_step_to_2fa';

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."second_factor" add "last_accepted_totp_step" bigint null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."second_factor" drop column "last_accepted_totp_step";`);
  }

}
