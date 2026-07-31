import { Migration } from '@mikro-orm/migrations';

export class Migration20260731003751_convert_check_enums_to_native_enum extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create type "identity"."account_subject" as enum ('SERVICE', 'SYSTEM', 'HUMAN');`);
    this.addSql(`create type "identity"."account_status" as enum ('DEACTIVATED', 'SUSPENDED', 'PENDING', 'ACTIVE');`);
    this.addSql(`create type "identity"."identifier_type" as enum ('email', 'phone', 'oauth');`);
    this.addSql(`create type "identity"."second_factor_type" as enum ('totp');`);
    this.addSql(`alter table "identity"."account" drop constraint "account_status_check";`);
    this.addSql(`alter table "identity"."account" drop constraint "account_subject_check";`);
    this.addSql(`alter table "identity"."account" alter column "status" type "identity"."account_status" using ("status"::"identity"."account_status");`);
    this.addSql(`alter table "identity"."account" alter column "subject" type "identity"."account_subject" using ("subject"::"identity"."account_subject");`);

    this.addSql(`alter table "identity"."identifier" drop constraint "identifier_type_check";`);
    this.addSql(`alter table "identity"."identifier" alter column "type" type "identity"."identifier_type" using ("type"::"identity"."identifier_type");`);

    this.addSql(`alter table "identity"."second_factor" drop constraint "second_factor_type_check";`);
    this.addSql(`alter table "identity"."second_factor" alter column "type" type "identity"."second_factor_type" using ("type"::"identity"."second_factor_type");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."account" alter column "subject" type text using ("subject"::text);`);
    this.addSql(`alter table "identity"."account" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "identity"."account" add constraint "account_status_check" check ("status" in ('DEACTIVATED', 'SUSPENDED', 'PENDING', 'ACTIVE'));`);
    this.addSql(`alter table "identity"."account" add constraint "account_subject_check" check ("subject" in ('SERVICE', 'SYSTEM', 'HUMAN'));`);

    this.addSql(`alter table "identity"."identifier" alter column "type" type text using ("type"::text);`);
    this.addSql(`alter table "identity"."identifier" add constraint "identifier_type_check" check ("type" in ('email', 'phone', 'oauth'));`);

    this.addSql(`alter table "identity"."second_factor" alter column "type" type text using ("type"::text);`);
    this.addSql(`alter table "identity"."second_factor" add constraint "second_factor_type_check" check ("type" in ('totp'));`);

    this.addSql(`drop type "identity"."account_subject";`);
    this.addSql(`drop type "identity"."account_status";`);
    this.addSql(`drop type "identity"."identifier_type";`);
    this.addSql(`drop type "identity"."second_factor_type";`);
  }

}
