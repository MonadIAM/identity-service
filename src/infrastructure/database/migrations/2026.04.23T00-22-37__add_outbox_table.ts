import { Migration } from '@mikro-orm/migrations';

export class Migration20260423002237_add_outbox_table extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "tracking"."outbox" ("id" uuid not null, "sequence_number" bigserial, "event_type" varchar(64) not null, "aggregate_type" varchar(64) not null, "destination_topic" varchar(128) not null, "payload" jsonb not null, "metadata" jsonb null, "created_at" timestamptz(3) not null, "ttl_expires_at" timestamptz(3) null, constraint "outbox_pkey" primary key ("id"));`);
    this.addSql(`create index "outbox_sequence_number_idx" on "tracking"."outbox" ("sequence_number");`);
    this.addSql(`create index "outbox_aggregate_idx" on "tracking"."outbox" ("aggregate_type");`);
    this.addSql(`create index "outbox_ttl_expires_at_idx" on "tracking"."outbox" ("ttl_expires_at");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tracking"."outbox" cascade;`);
  }

}
