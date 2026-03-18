import { Migration } from '@mikro-orm/migrations';

export class Migration20260318121921_adjustments_pt4 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."account" alter column "version" drop default;`);
    this.addSql(`alter table "identity"."account" alter column "version" type int using ("version"::int);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."account" alter column "version" type int using ("version"::int);`);
    this.addSql(`alter table "identity"."account" alter column "version" set default 1;`);
  }

}
