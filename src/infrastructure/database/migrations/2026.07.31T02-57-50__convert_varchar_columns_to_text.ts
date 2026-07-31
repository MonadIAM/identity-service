import { Migration } from '@mikro-orm/migrations';

export class Migration20260731025750_convert_varchar_columns_to_text extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`alter table "identity"."application" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "identity"."interface_client" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "identity"."profile" alter column "display_name" type text using ("display_name"::text);`);
    this.addSql(`alter table "identity"."profile" alter column "locale" type text using ("locale"::text);`);
    this.addSql(`alter table "identity"."profile" alter column "time_zone" type text using ("time_zone"::text);`);

    this.addSql(`alter table "identity"."second_factor" alter column "name" type text using ("name"::text);`);

    this.addSql(`alter table "identity"."service_client" alter column "code" type text using ("code"::text);`);
    this.addSql(`alter table "identity"."service_client" alter column "name" type text using ("name"::text);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."application" alter column "name" type varchar(255) using ("name"::varchar(255));`);

    this.addSql(`alter table "identity"."interface_client" alter column "name" type varchar(255) using ("name"::varchar(255));`);

    this.addSql(`alter table "identity"."profile" alter column "display_name" type varchar(255) using ("display_name"::varchar(255));`);
    this.addSql(`alter table "identity"."profile" alter column "locale" type varchar(16) using ("locale"::varchar(16));`);
    this.addSql(`alter table "identity"."profile" alter column "time_zone" type varchar(64) using ("time_zone"::varchar(64));`);

    this.addSql(`alter table "identity"."second_factor" alter column "name" type varchar(128) using ("name"::varchar(128));`);

    this.addSql(`alter table "identity"."service_client" alter column "code" type varchar(128) using ("code"::varchar(128));`);
    this.addSql(`alter table "identity"."service_client" alter column "name" type varchar(255) using ("name"::varchar(255));`);
  }

}
