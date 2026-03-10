import { Migration } from '@mikro-orm/migrations';

export class Migration20260310185245_adjustments_pt2 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'SET_PRIMARY_IDENTIFIER', 'CONFIRM_SECOND_FACTOR', 'REMOVE_SECOND_FACTOR', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'RESET_BY_MASTER_CODE', 'REVOKE_ALL_SESSIONS', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DISABLE_ENFORCE_2FA', 'ENABLE_ENFORCE_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'REMOVE_IDENTIFIER', 'UPDATE_IDENTIFIER', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CHANGE_PASSWORD', 'RESET_PASSWORD', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'ADD_IDENTIFIER', 'CREATE_SESSION', 'REVOKE_SESSION', 'FORCE_LOGOUT', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."identifier" rename column "usable_as2fa" to "allow_passwordless_login";`);

    this.addSql(`alter table "identity"."second_factor" drop column "is_preferred";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "identity"."audit_journal" drop constraint if exists "audit_journal_action_type_check";`);

    this.addSql(`alter table "identity"."audit_journal" add constraint "audit_journal_action_type_check" check("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'RESET_PASSWORD', 'SET_PASSWORD'));`);

    this.addSql(`alter table "identity"."identifier" rename column "allow_passwordless_login" to "usable_as2fa";`);

    this.addSql(`alter table "identity"."second_factor" add column "is_preferred" boolean not null;`);
  }

}
