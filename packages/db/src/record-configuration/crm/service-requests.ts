import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import {
  SERVICE_REQUEST_STATUS_VALUES,
  ServiceRequestStatus,
} from "@invessiv/common/constants/crm/service-request-statuses";
import {
  SERVICE_REQUEST_PROJECT_WISH_VALUES,
  ServiceRequestProjectWish,
} from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestFieldLimits as Limits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ServiceRequestsConstraintName as C } from "@invessiv/db/constraint-names/crm/service-requests-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { customers } from "./customers";
import { lineItemTemplates } from "./line-item-templates";
import { projects } from "./projects";
import { projectLineItems } from "./project-line-items";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    line_item_template_id: uuid("line_item_template_id").references(
      () => lineItemTemplates.id,
      { onDelete: "set null" },
    ),
    kind: text("kind", { enum: LINE_ITEM_KIND_VALUES }).notNull(),
    title: text("title").notNull(),
    note: text("note").notNull(),
    requested_minutes: integer("requested_minutes"),
    project_wish: text("project_wish", {
      enum: SERVICE_REQUEST_PROJECT_WISH_VALUES,
    }).notNull(),
    requested_project_id: uuid("requested_project_id"),
    requested_by_membership_id: uuid("requested_by_membership_id").notNull(),
    status: text("status", { enum: SERVICE_REQUEST_STATUS_VALUES }).notNull(),
    decline_reason: text("decline_reason"),
    offered_at: timestamp("offered_at", { withTimezone: true }),
    offered_price_cents: integer("offered_price_cents"),
    offered_minutes: integer("offered_minutes"),
    decided_at: timestamp("decided_at", { withTimezone: true }),
    decided_by_member_id: uuid("decided_by_member_id").references(
      () => workspaceMembers.id,
    ),
    project_id: uuid("project_id"),
    project_line_item_id: uuid("project_line_item_id").references(
      () => projectLineItems.id,
      { onDelete: "set null" },
    ),
    idempotency_key: uuid("idempotency_key").notNull(),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: C.RequestedProjectForeignKey,
      columns: [t.requested_project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: C.ProjectForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: C.MembershipForeignKey,
      columns: [t.requested_by_membership_id, t.customer_id],
      foreignColumns: [portalMemberships.id, portalMemberships.customer_id],
    }),
    check(C.KindCheck, sqlCheckIn(t.kind, LINE_ITEM_KIND_VALUES)),
    check(
      C.TitleCheck,
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sql.raw(String(Limits.TitleMaxLength))}`,
    ),
    check(
      C.NoteCheck,
      sql`length(${t.note}) <= ${sql.raw(String(Limits.NoteMaxLength))}`,
    ),
    check(
      C.MinutesCheck,
      sql`${t.requested_minutes} is null or (${t.requested_minutes} > 0 and ${t.requested_minutes} % ${sql.raw(String(HoursLimits.StepMinutes))} = 0 and ${t.requested_minutes} <= ${sql.raw(String(HoursLimits.MaxLedgerMinutes))})`,
    ),
    check(
      C.KindMinutesCheck,
      sql`(${t.requested_minutes} is not null) = (${t.kind} = ${LineItemKind.Hours})`,
    ),
    check(
      C.WishCheck,
      sqlCheckIn(t.project_wish, SERVICE_REQUEST_PROJECT_WISH_VALUES),
    ),
    check(
      C.WishProjectCheck,
      sql`(${t.project_wish} = ${ServiceRequestProjectWish.Existing}) = (${t.requested_project_id} is not null)`,
    ),
    check(C.StatusCheck, sqlCheckIn(t.status, SERVICE_REQUEST_STATUS_VALUES)),
    check(
      C.DeclineReasonCheck,
      sql`${t.decline_reason} is null or length(${t.decline_reason}) <= ${sql.raw(String(Limits.DeclineReasonMaxLength))}`,
    ),
    check(
      C.AcceptedCheck,
      sql`${t.status} <> ${ServiceRequestStatus.Accepted} or (${t.project_id} is not null and ${t.decided_at} is not null and ${t.decided_by_member_id} is not null)`,
    ),
    check(
      C.DeclinedCheck,
      sql`${t.status} <> ${ServiceRequestStatus.Declined} or (${t.decline_reason} is not null and btrim(${t.decline_reason}) <> '' and ${t.decided_by_member_id} is not null)`,
    ),
    check(C.VersionCheck, sql`${t.version} > 0`),
    check(
      C.OfferedPriceCheck,
      sql`${t.offered_price_cents} is null or ${t.offered_price_cents} >= 0`,
    ),
    check(
      C.OfferedMinutesCheck,
      sql`${t.offered_minutes} is null or (${t.kind} = ${LineItemKind.Hours} and ${t.offered_minutes} > 0 and ${t.offered_minutes} % ${sql.raw(String(HoursLimits.StepMinutes))} = 0 and ${t.offered_minutes} <= ${sql.raw(String(HoursLimits.MaxLedgerMinutes))})`,
    ),
    uniqueIndex(C.IdempotencyUnique).on(t.idempotency_key),
    index(C.CustomerCreatedIndex).on(t.customer_id, t.created_at.desc()),
    index(C.StatusCreatedIndex).on(t.status, t.created_at.desc()),
  ],
);
