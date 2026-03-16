import { Migration } from '@mikro-orm/migrations';

export class Migration20260316143144_adjustments_pt3 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`alter table "identity"."audit_journal" alter column "by" drop default;`);
    this.addSql(`alter table "identity"."audit_journal" alter column "by" type uuid using ("by"::text::uuid);`);
    this.addSql(`alter table "identity"."audit_journal" alter column "by" drop not null;`);
    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'REGENERATE_RECOVERY_CODES', 'SET_PRIMARY_IDENTIFIER', 'CONFIRM_SECOND_FACTOR', 'REMOVE_SECOND_FACTOR', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'RESET_BY_MASTER_CODE', 'REVOKE_ALL_SESSIONS', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DISABLE_ENFORCE_2FA', 'ENABLE_ENFORCE_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'REMOVE_IDENTIFIER', 'UPDATE_IDENTIFIER', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CHANGE_PASSWORD', 'RESET_PASSWORD', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'ADD_IDENTIFIER', 'CREATE_SESSION', 'REVOKE_SESSION', 'FORCE_LOGOUT', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop default;`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" type uuid using ("primary_identifier_id"::text::uuid);`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop not null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."account" drop constraint "account_primary_identifier_id_foreign";`);

    this.addSql(`alter table "identity"."audit_journal" alter column "by" drop default;`);
    this.addSql(`alter table "identity"."audit_journal" alter column "by" type uuid using ("by"::text::uuid);`);
    this.addSql(`alter table "identity"."audit_journal" alter column "by" set not null;`);
    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'SET_PRIMARY_IDENTIFIER', 'CONFIRM_SECOND_FACTOR', 'REMOVE_SECOND_FACTOR', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'RESET_BY_MASTER_CODE', 'REVOKE_ALL_SESSIONS', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DISABLE_ENFORCE_2FA', 'ENABLE_ENFORCE_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'REMOVE_IDENTIFIER', 'UPDATE_IDENTIFIER', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CHANGE_PASSWORD', 'RESET_PASSWORD', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'ADD_IDENTIFIER', 'CREATE_SESSION', 'REVOKE_SESSION', 'FORCE_LOGOUT', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" drop default;`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" type uuid using ("primary_identifier_id"::text::uuid);`);
    this.addSql(`alter table "identity"."account" alter column "primary_identifier_id" set not null;`);
    this.addSql(`alter table "identity"."account" add constraint "account_primary_identifier_id_foreign" foreign key ("primary_identifier_id") references "identity"."identifier" ("id") on update cascade;`);
  }

}
