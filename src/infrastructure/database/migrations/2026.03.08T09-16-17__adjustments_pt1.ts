import { Migration } from '@mikro-orm/migrations';

export class Migration20260308091617_adjustments_pt1 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'RESET_PASSWORD', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop default;`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" type uuid using ("primary_identifier_id"::text::uuid);`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" set not null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade;`);

    this.addSql(`alter table "identity"."notification" drop column "type";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'ACTIVATE_ACCOUNT', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CREATE_ACCOUNT', 'UPDATE_PROFILE', 'RESET_PASSWORD', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop default;`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" type uuid using ("primary_identifier_id"::text::uuid);`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop not null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "identity"."notification" add column "type" varchar(128) not null;`);
  }

}
