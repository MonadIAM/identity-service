import { Migration } from '@mikro-orm/migrations';

export class Migration20260308061609_add_audit_journal_table extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "identity"."audit_journal" ("id" uuid not null, "entity" uuid not null, "by" uuid not null, "at" timestamptz(3) not null, "reason" text null, "patch" jsonb null, "ip" text null, "user_agent" text null, "action_type" text check ("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'ACTIVATE_ACCOUNT', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CREATE_ACCOUNT', 'UPDATE_PROFILE', 'RESET_PASSWORD', 'SET_PASSWORD')) not null, "entity_type" text check ("entity_type" in ('RECOVERY_CODE', 'SECOND_FACTOR', 'MASTER_CODE', 'IDENTIFIER', 'PASSWORD', 'PROFILE', 'SESSION', 'ACCOUNT')) not null, "created_at" timestamptz(3) not null, constraint "audit_journal_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_journal_entity_idx" on "identity"."audit_journal" ("entity_type", "entity");`);
    this.addSql(`create index "audit_journal_by_at_idx" on "identity"."audit_journal" ("by", "at");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "identity"."audit_journal" cascade;`);
  }

}
