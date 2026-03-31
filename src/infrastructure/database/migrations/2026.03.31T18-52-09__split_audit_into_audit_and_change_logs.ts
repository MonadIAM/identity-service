import { Migration } from '@mikro-orm/migrations';

export class Migration20260331185209_split_audit_into_audit_and_change_logs extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create schema if not exists "tracking";`);
    this.addSql(`create table "tracking"."audit_log" ("id" uuid not null, "action_type" varchar(64) not null, "entity_type" varchar(64) not null, "realm" uuid null, "actor" uuid not null, "ip" varchar(45) null, "user_agent" text null, "input" jsonb null, "created_at" timestamptz(3) not null, constraint "audit_log_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_log_realm_idx" on "tracking"."audit_log" ("realm");`);
    this.addSql(`create index "audit_log_actor_created_at_idx" on "tracking"."audit_log" ("actor", "created_at");`);
    this.addSql(`create index "audit_log_entity_type_action_type_idx" on "tracking"."audit_log" ("entity_type", "action_type");`);

    this.addSql(`create table "tracking"."change_log" ("id" uuid not null, "audit_entry_id" uuid not null, "change_type" varchar(16) not null, "entity_type" varchar(64) not null, "entity" uuid not null, "delta" jsonb not null, "created_at" timestamptz(3) not null, constraint "change_log_pkey" primary key ("id"));`);
    this.addSql(`create index "change_log_audit_entry_idx" on "tracking"."change_log" ("audit_entry_id");`);
    this.addSql(`create index "change_log_entity_type_entity_id_idx" on "tracking"."change_log" ("entity_type", "entity");`);

    this.addSql(`drop table if exists "identity"."audit_journal" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "identity"."audit_journal" ("id" uuid not null, "entity" uuid not null, "by" uuid null, "at" timestamptz(3) not null, "reason" text null, "patch" jsonb null, "ip" text null, "user_agent" text null, "action_type" text check ("action_type" in ('DISABLE_RECEIVE_NOTIFICATIONS', 'ENABLE_RECEIVE_NOTIFICATIONS', 'REGENERATE_RECOVERY_CODES', 'SET_PRIMARY_IDENTIFIER', 'CONFIRM_SECOND_FACTOR', 'REMOVE_SECOND_FACTOR', 'DISABLE_ENFORCED_2FA', 'DISABLE_USAGE_AS_2FA', 'RESET_BY_MASTER_CODE', 'REVOKE_ALL_SESSIONS', 'ENABLE_ENFORCED_2FA', 'ENABLE_USAGE_AS_2FA', 'DISABLE_ENFORCE_2FA', 'ENABLE_ENFORCE_2FA', 'DEACTIVATE_ACCOUNT', 'VERIFY_IDENTIFIER', 'UNSUSPEND_ACCOUNT', 'REMOVE_IDENTIFIER', 'UPDATE_IDENTIFIER', 'RESTORE_ACCOUNT', 'SUSPEND_ACCOUNT', 'CHANGE_PASSWORD', 'RESET_PASSWORD', 'CREATE_ACCOUNT', 'VERIFY_ACCOUNT', 'UPDATE_PROFILE', 'ADD_IDENTIFIER', 'CREATE_SESSION', 'REVOKE_SESSION', 'FORCE_LOGOUT', 'SET_PASSWORD')) not null, "entity_type" text check ("entity_type" in ('RECOVERY_CODE', 'SECOND_FACTOR', 'MASTER_CODE', 'IDENTIFIER', 'PASSWORD', 'PROFILE', 'SESSION', 'ACCOUNT')) not null, "created_at" timestamptz(3) not null, constraint "audit_journal_pkey" primary key ("id"));`);
    this.addSql(`create index "audit_journal_entity_idx" on "identity"."audit_journal" ("entity_type", "entity");`);
    this.addSql(`create index "audit_journal_by_at_idx" on "identity"."audit_journal" ("by", "at");`);

    this.addSql(`drop table if exists "tracking"."audit_log" cascade;`);

    this.addSql(`drop table if exists "tracking"."change_log" cascade;`);

    this.addSql(`drop schema if exists "tracking";`);
  }

}
