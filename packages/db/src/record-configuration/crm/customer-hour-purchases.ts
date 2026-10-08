import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  HOUR_PURCHASE_KIND_VALUES,
  HourPurchaseKind,
} from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HOUR_PURCHASE_SOURCE_VALUES } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { CustomerHourPurchasesConstraintName as N } from "@invessiv/db/constraint-names/crm/customer-hour-purchases-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { customers } from "./customers";
import { workspaceMembers } from "./workspace-members";

/**
 * Immutable ledger of the hours a customer bought. There is no version and no update path: a wrong
 * row is corrected by a negative one, so the customer's stock is always a sum over this table and
 * can never drift from its own history.
 */
export const customerHourPurchases = pgTable(
  "customer_hour_purchases",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    kind: text("kind", { enum: HOUR_PURCHASE_KIND_VALUES }).notNull(),
    source: text("source", { enum: HOUR_PURCHASE_SOURCE_VALUES }).notNull(),
    minutes: integer("minutes").notNull(),
    purchased_on: date("purchased_on").notNull(),
    // Customer-visible label; an empty string means "no note", so the column needs no null.
    note: text("note").notNull(),
    idempotency_key: uuid("idempotency_key").notNull(),
    created_by_member_id: uuid("created_by_member_id").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.CustomerForeignKey,
      columns: [t.customer_id],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
    // No cascade on the author: the history stays referencable.
    foreignKey({
      name: N.CreatedByMemberForeignKey,
      columns: [t.created_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    unique(N.IdempotencyKeyUnique).on(t.idempotency_key),
    check(N.KindCheck, sqlCheckIn(t.kind, HOUR_PURCHASE_KIND_VALUES)),
    check(N.SourceCheck, sqlCheckIn(t.source, HOUR_PURCHASE_SOURCE_VALUES)),
    check(
      N.MinutesCheck,
      sql`${t.minutes} <> 0 and ${t.minutes} % ${sqlLimit(HoursLimits.StepMinutes)} = 0 and abs(${t.minutes}) <= ${sqlLimit(HoursLimits.MaxLedgerMinutes)}`,
    ),
    check(
      N.KindSignCheck,
      sql`(${t.kind} = ${HourPurchaseKind.Purchase} and ${t.minutes} > 0) or (${t.kind} = ${HourPurchaseKind.Correction} and ${t.minutes} < 0)`,
    ),
    check(
      N.NoteCheck,
      sql`length(${t.note}) <= ${sqlLimit(HoursLimits.NoteMaxLength)}`,
    ),
    index(N.CustomerPurchasedIndex).on(
      t.customer_id,
      t.purchased_on.desc(),
      t.created_at.desc(),
    ),
  ],
);
