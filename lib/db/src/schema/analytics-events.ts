import {
  index,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventName: varchar("event_name", { length: 50 }).notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    module: varchar("module", { length: 30 }).notNull(),
    properties: jsonb("properties")
      .$type<Record<string, string | number | boolean>>()
      .notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_visitor_idx").on(table.visitorHash),
  ],
);