import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import {
  CREDENTIAL_SIDE_VALUES,
  CredentialSide,
} from "@invessiv/common/constants/credentials/credential-sides";
import { CREDENTIAL_TYPE_VALUES } from "@invessiv/common/constants/credentials/credential-types";
import { CustomerCredentialsConstraintName as N } from "@invessiv/db/constraint-names/crm/customer-credentials-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { customers } from "./customers";
import { portalMemberships } from "./portal-memberships";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";

/**
 * Secret and note exist only as ciphertext (`@invessiv/db/credentials`). The username stays
 * plaintext on purpose: it is worthless without the secret and must be copyable without a reveal.
 */
export const customerCredentials = pgTable(
  "customer_credentials",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    project_id: uuid("project_id"),
    title: text("title").notNull(),
    credential_type: text("credential_type", {
      enum: CREDENTIAL_TYPE_VALUES,
    }).notNull(),
    url: text("url"),
    username: text("username"),
    secret_ciphertext: text("secret_ciphertext").notNull(),
    note_ciphertext: text("note_ciphertext"),
    visible_to_customer: boolean("visible_to_customer").notNull(),
    created_by_side: text("created_by_side", {
      enum: CREDENTIAL_SIDE_VALUES,
    }).notNull(),
    created_by_member_id: uuid("created_by_member_id"),
    created_by_portal_membership_id: uuid("created_by_portal_membership_id"),
    secret_changed_at: timestamp("secret_changed_at", {
      withTimezone: true,
    }).notNull(),
    last_revealed_at: timestamp("last_revealed_at", { withTimezone: true }),
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
      name: N.CustomerForeignKey,
      columns: [t.customer_id],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }),
    // No cascade on the origin: the history stays referencable.
    foreignKey({
      name: N.CreatedByMemberForeignKey,
      columns: [t.created_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.CreatedByPortalMembershipForeignKey,
      columns: [t.created_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }),
    check(
      N.TitleCheck,
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sqlLimit(CREDENTIAL_LIMITS.titleMax)}`,
    ),
    check(N.TypeCheck, sqlCheckIn(t.credential_type, CREDENTIAL_TYPE_VALUES)),
    check(
      N.UrlCheck,
      sql`length(${t.url}) <= ${sqlLimit(CREDENTIAL_LIMITS.urlMax)}`,
    ),
    check(
      N.UsernameCheck,
      sql`length(${t.username}) <= ${sqlLimit(CREDENTIAL_LIMITS.usernameMax)}`,
    ),
    check(N.SideCheck, sqlCheckIn(t.created_by_side, CREDENTIAL_SIDE_VALUES)),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.OriginCheck,
      sql`num_nonnulls(${t.created_by_member_id}, ${t.created_by_portal_membership_id}) = 1 and ((${t.created_by_side} = ${CredentialSide.Internal} and ${t.created_by_member_id} is not null) or (${t.created_by_side} = ${CredentialSide.Customer} and ${t.created_by_portal_membership_id} is not null))`,
    ),
    check(
      N.CustomerVisibleCheck,
      sql`${t.created_by_side} <> ${CredentialSide.Customer} or ${t.visible_to_customer}`,
    ),
    index(N.CustomerTypeIndex).on(t.customer_id, t.credential_type),
    index(N.ProjectIndex)
      .on(t.project_id)
      .where(sql`${t.project_id} is not null`),
  ],
);
