/**
 * Verifies the invariants of the CRM core schema against a real database.
 *
 * The merge gate of unit 01 asks for exactly this: constraints, sequence gaps and
 * invalid references must be rejected by Postgres, not by application code.
 * A mocked unit test could not prove that.
 *
 * Every row carries a fixture prefix and is removed at the end — even if a check fails.
 */
import { randomUUID } from "node:crypto";

import { getDatabaseClient, getDatabaseUrl } from "@invessiv/db/core";
import { TasksConstraintName } from "@invessiv/db/constraint-names/crm/tasks-constraint-names";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";

const FIXTURE_PREFIX = "smoke:crm-constraints:";
const ALLOWED_TARGETS: DatabaseTarget[] = ["development", "preview"];

type Sql = ReturnType<typeof getDatabaseClient>;

const checks: { name: string; ok: boolean; detail?: string }[] = [];

function record(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

/** Expects the statement to be rejected by Postgres. */
async function expectRejected(
  name: string,
  run: () => Promise<unknown>,
  constraint?: string,
) {
  try {
    await run();
    record(name, false, "was accepted, expected a rejection");
  } catch (error: unknown) {
    const actualConstraint =
      typeof error === "object" && error !== null && "constraint" in error
        ? error.constraint
        : undefined;
    record(
      name,
      !constraint || actualConstraint === constraint,
      constraint && actualConstraint !== constraint
        ? `Expected constraint ${constraint}, got ${String(actualConstraint)}`
        : undefined,
    );
  }
}

async function expectAccepted(name: string, run: () => Promise<unknown>) {
  try {
    await run();
    record(name, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    record(name, false, message);
  }
}

async function seedBaseRows(sql: Sql) {
  const memberId = randomUUID();
  const personId = randomUUID();

  const userId = randomUUID();

  await sql`
        INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
        VALUES (${userId}, ${`${FIXTURE_PREFIX}${userId}`},
                ${`${FIXTURE_PREFIX}owner@example.test`}, ${`${FIXTURE_PREFIX}Owner`}, TRUE, 1)
    `;

  await sql`
        INSERT INTO workspace_members (id, user_id, active, version)
        VALUES (${memberId}, ${userId}, TRUE, 1)
    `;

  await sql`
        INSERT INTO people (id, display_name, primary_email, preferred_locale, version)
        VALUES (${personId}, ${`${FIXTURE_PREFIX}Person`},
                ${`${FIXTURE_PREFIX}person@example.test`}, 'de', 1)
    `;

  return { memberId, personId };
}

async function insertCustomer(
  sql: Sql,
  args: {
    ownerMemberId: string;
    displayName: string;
    companyName?: string | null;
    status?: string;
    version?: number;
  },
) {
  const id = randomUUID();
  await sql`
    INSERT INTO customers (id, display_name, company_name, status,
                               owner_member_id, version)
        VALUES (${id}, ${args.displayName}, ${args.companyName ?? null},
                ${args.status ?? "active"},
                ${args.ownerMemberId}, ${args.version ?? 1})
    `;
  return id;
}

async function runChecks(sql: Sql) {
  const { memberId, personId } = await seedBaseRows(sql);
  const name = (suffix: string) => `${FIXTURE_PREFIX}${suffix}`;

  // Happy path
  const customerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Customer A"),
    companyName: name("Example Ltd"),
  });
  record("customer with required fields can be created", Boolean(customerId));

  // Const-object values are enforced by Postgres
  await expectRejected("unknown status is rejected", () =>
    insertCustomer(sql, {
      ownerMemberId: memberId,
      displayName: name("Invalid status"),
      status: "onboarding",
    }),
  );

  await expectRejected("version = 0 is rejected", () =>
    insertCustomer(sql, {
      ownerMemberId: memberId,
      displayName: name("Version zero"),
      version: 0,
    }),
  );

  await expectRejected("blank display name is rejected", () =>
    insertCustomer(sql, {
      ownerMemberId: memberId,
      displayName: "   ",
    }),
  );

  await expectRejected("unknown owner is rejected", () =>
    insertCustomer(sql, {
      ownerMemberId: randomUUID(),
      displayName: name("Without owner"),
    }),
  );

  // The normalized display name is the duplicate guard (decision of 13.09.2026)
  await expectRejected(
    "a display name differing only in case and surrounding whitespace is rejected",
    () =>
      insertCustomer(sql, {
        ownerMemberId: memberId,
        displayName: `  ${name("Customer A").toUpperCase()} `,
      }),
  );

  // Duplicate company names are a product decision, not an error
  await expectAccepted(
    "two customers with an identical company name are allowed",
    () =>
      insertCustomer(sql, {
        ownerMemberId: memberId,
        displayName: name("Customer B"),
        companyName: name("Example Ltd"),
      }),
  );

  // A customer without a company name is valid.
  await expectAccepted("customer without a company name is valid", () =>
    insertCustomer(sql, {
      ownerMemberId: memberId,
      displayName: name("Individual"),
      companyName: null,
    }),
  );

  // Sequence: ascending, gaps valid, no reuse
  const beforeGap = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Before gap"),
  });
  const gapRows = (await sql`
        SELECT NEXTVAL('customers_customer_number_seq') ::int AS burned
    `) as { burned: number }[];
  const afterGap = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("After gap"),
  });

  const numberRows = (await sql`
        SELECT customer_number
        FROM customers
        WHERE id IN (${beforeGap}, ${afterGap})
        ORDER BY customer_number
    `) as { customer_number: number }[];

  const [low, high] = numberRows.map((row) => row.customer_number);
  record(
    "customer numbers ascend",
    numberRows.length === 2 && high > low,
    `received: ${numberRows.map((r) => r.customer_number).join(", ")}`,
  );
  record(
    "a consumed number leaves a valid gap",
    high - low === 2 && gapRows[0].burned === low + 1,
    `gap at ${low + 1}, distance ${high - low}`,
  );

  // Primary contact: at most one per customer
  await expectAccepted(
    "first primary contact can be assigned",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${customerId}, ${personId}, TRUE, 1)
            `,
  );

  await runPortalFoundationChecks(sql, customerId, personId, memberId, name);

  const secondPersonId = randomUUID();
  await sql`
        INSERT INTO people (id, display_name, preferred_locale, version)
        VALUES (${secondPersonId}, ${name("Second person")}, 'de', 1)
    `;

  await expectRejected(
    "second primary contact for the same customer is rejected",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${customerId}, ${secondPersonId}, TRUE, 1)
            `,
  );

  await expectAccepted(
    "further contact without the primary flag is allowed",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${customerId}, ${secondPersonId}, FALSE, 1)
            `,
  );

  await expectRejected(
    "the same person twice on the same customer is rejected",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${customerId}, ${secondPersonId}, FALSE, 1)
            `,
  );

  // The same person serving two customers is the intended case
  const otherCustomerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Customer C"),
  });
  await expectAccepted(
    "the same person can serve two customers",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${otherCustomerId}, ${personId}, TRUE, 1)
            `,
  );

  // Invalid references
  await expectRejected(
    "assignment to an unknown customer is rejected",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${randomUUID()}, ${personId}, FALSE, 1)
            `,
  );

  await expectRejected(
    "assignment to an unknown person is rejected",
    () =>
      sql`
                INSERT INTO customer_contact_assignments
                    (id, customer_id, person_id, is_primary, version)
                VALUES (${randomUUID()}, ${customerId}, ${randomUUID()}, FALSE, 1)
            `,
  );

  // ON DELETE RESTRICT: a person with an active assignment stays protected
  await expectRejected(
    "person with an assignment cannot be deleted",
    () => sql`DELETE
                  FROM people
                  WHERE id = ${personId}`,
  );

  // ON DELETE CASCADE: assignments disappear with the customer
  await sql`DELETE
              FROM customers
              WHERE id = ${otherCustomerId}`;
  const orphanRows = (await sql`
        SELECT COUNT(*) ::int AS count
        FROM customer_contact_assignments
        WHERE customer_id = ${otherCustomerId}
    `) as { count: number }[];
  record(
    "deleting a customer removes its assignments",
    orphanRows[0].count === 0,
    `remaining: ${orphanRows[0].count}`,
  );

  // preferred_locale is limited to the supported locales
  await expectRejected(
    "unknown portal locale is rejected",
    () =>
      sql`
                INSERT INTO people (id, display_name, preferred_locale, version)
                VALUES (${randomUUID()}, ${name("Wrong locale")}, 'fr', 1)
            `,
  );

  await runMissingDefaultChecks(sql, memberId, personId, name);
  await runLineItemTemplateChecks(sql, name);
  await runProjectLineItemChecks(sql, memberId, name);
  await runTaskChecks(sql, memberId, name);
  await runConcurrencyChecks(sql, memberId, name);
}

/**
 * A portal membership can only exist for a customer/person pair that is a real contact
 * assignment, not any pair that happens to both exist. An invitation may have at most one open
 * (unredeemed, unrevoked) row per assignment; revoking one frees the slot for a new one.
 */
async function runPortalFoundationChecks(
  sql: Sql,
  customerId: string,
  personId: string,
  memberId: string,
  name: (suffix: string) => string,
) {
  const userId = randomUUID();
  await sql`
        INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
        VALUES (${userId}, ${name(userId)}, ${name(`${userId}@example.test`)}, ${name("Portal user")}, TRUE, 1)
    `;

  const membershipId = randomUUID();
  await expectAccepted(
    "portal membership for an existing contact assignment is accepted",
    () => sql`
            INSERT INTO portal_memberships
            (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
            VALUES (${membershipId}, ${customerId}, ${personId}, ${userId}, NOW(), TRUE, 1)
        `,
  );

  await expectRejected(
    "a second portal membership for the same customer and person is rejected",
    () => sql`
            INSERT INTO portal_memberships
            (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
            VALUES (${randomUUID()}, ${customerId}, ${personId}, ${userId}, NOW(), TRUE, 1)
        `,
  );

  const strangerPersonId = randomUUID();
  await sql`
        INSERT INTO people (id, display_name, preferred_locale, version)
        VALUES (${strangerPersonId}, ${name("Stranger")}, 'de', 1)
    `;
  await expectRejected(
    "a portal membership without a matching contact assignment is rejected",
    () => sql`
            INSERT INTO portal_memberships
            (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
            VALUES (${randomUUID()}, ${customerId}, ${strangerPersonId}, ${userId}, NOW(), TRUE, 1)
        `,
  );

  await expectRejected(
    "a portal membership without version is rejected",
    () => sql`
            INSERT INTO portal_memberships
            (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled)
            VALUES (${randomUUID()}, ${customerId}, ${personId}, ${userId}, NOW(), TRUE)
        `,
  );

  await expectRejected(
    "a portal membership without the mail preference is rejected",
    () => sql`
            INSERT INTO portal_memberships
                (id, customer_id, person_id, user_id, activated_at, version)
            VALUES (${randomUUID()}, ${customerId}, ${personId}, ${userId}, NOW(), 1)
        `,
  );

  const assignmentRows = (await sql`
        SELECT id
        FROM customer_contact_assignments
        WHERE customer_id = ${customerId}
          AND person_id = ${personId}
    `) as { id: string }[];
  const assignmentId = assignmentRows[0]?.id;

  const invitationId = randomUUID();
  await expectAccepted(
    "an open invitation for a contact assignment is accepted",
    () => sql`
            INSERT INTO portal_invitations
            (id, assignment_id, token_hash, email_notifications_enabled, expires_at, created_by_member_id)
            VALUES (${invitationId}, ${assignmentId}, ${name("token-1")}, TRUE, NOW() + INTERVAL '7 days',
                    ${memberId})
        `,
  );

  await expectRejected(
    "a second open invitation for the same assignment is rejected",
    () => sql`
            INSERT INTO portal_invitations
            (id, assignment_id, token_hash, email_notifications_enabled, expires_at, created_by_member_id)
            VALUES (${randomUUID()}, ${assignmentId}, ${name("token-2")}, TRUE, NOW() + INTERVAL '7 days',
                    ${memberId})
        `,
  );

  await sql`UPDATE portal_invitations
              SET revoked_at = NOW()
              WHERE id = ${invitationId}`;

  await expectAccepted(
    "inviting again after revoking the open invitation is accepted",
    () => sql`
            INSERT INTO portal_invitations
            (id, assignment_id, token_hash, email_notifications_enabled, expires_at, created_by_member_id)
            VALUES (${randomUUID()}, ${assignmentId}, ${name("token-3")}, TRUE, NOW() + INTERVAL '7 days',
                    ${memberId})
        `,
  );

  await expectRejected(
    "an invitation without the mail preference is rejected",
    () => sql`
            INSERT INTO portal_invitations
                (id, assignment_id, token_hash, expires_at, created_by_member_id)
            VALUES (${randomUUID()}, ${assignmentId}, ${name("token-4")}, NOW() + INTERVAL '7 days', ${memberId})
        `,
  );

  await expectRejected(
    "an invitation with both redeemed_at and revoked_at set is rejected",
    () => sql`
            INSERT INTO portal_invitations
            (id, assignment_id, token_hash, email_notifications_enabled, expires_at, redeemed_at, revoked_at,
             created_by_member_id)
            VALUES (${randomUUID()}, ${assignmentId}, ${name("token-5")}, TRUE, NOW() + INTERVAL '7 days', NOW(),
                    NOW(), ${memberId})
        `,
  );
}

/**
 * A project line item belongs to exactly one project and carries no customer column, so the
 * project is the only path to its customer. The template reference is provenance: it may be
 * null and must never cascade the row away.
 */
async function runProjectLineItemChecks(
  sql: Sql,
  memberId: string,
  name: (suffix: string) => string,
) {
  const customerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Project line item customer"),
  });
  const projectId = randomUUID();
  await sql`
    INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                          current_process_step, workflow_key, billing_model,
                          included_feedback_rounds, version)
    VALUES (${projectId}, ${customerId}, ${memberId}, ${name("Project")}, 'active', 'onboarding',
            ARRAY ['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)
  `;
  const templateId = randomUUID();
  await sql`
    INSERT INTO line_item_templates (id, title, description, price_cents, pricing_mode,
                                   recurring_interval, status, version)
    VALUES (${templateId}, ${name("Origin template")}, '', 10000, 'one_time', NULL, 'active', 1)
  `;

  const insertService = (args: {
    projectId?: string;
    templateId?: string | null;
    title?: string;
    priceCents?: number;
    pricingMode?: string;
    recurringInterval?: string | null;
    version?: number;
  }) => sql`
    INSERT INTO project_line_items (
      id, project_id, source_line_item_template_id, title, description, price_cents,
      pricing_mode, recurring_interval, version
    )
    VALUES (
      ${randomUUID()}, ${args.projectId ?? projectId},
      ${args.templateId === undefined ? templateId : args.templateId},
      ${args.title ?? name("Service")}, '', ${args.priceCents ?? 10000},
      ${args.pricingMode ?? "one_time"}, ${args.recurringInterval ?? null}, ${args.version ?? 1}
    )
  `;

  await expectAccepted("valid project line item is accepted", () =>
    insertService({}),
  );
  await expectAccepted(
    "project line item without an origin template is accepted",
    () => insertService({ templateId: null }),
  );
  await expectAccepted(
    "recurring project line item with interval is accepted",
    () =>
      insertService({ pricingMode: "recurring", recurringInterval: "monthly" }),
  );
  await expectRejected("project line item without a project is rejected", () =>
    insertService({ projectId: randomUUID() }),
  );
  await expectRejected(
    "project line item with an unknown template is rejected",
    () => insertService({ templateId: randomUUID() }),
  );
  await expectRejected("blank project line item title is rejected", () =>
    insertService({ title: "   " }),
  );
  await expectRejected("negative project line item price is rejected", () =>
    insertService({ priceCents: -1 }),
  );
  await expectRejected(
    "unknown project line item pricing mode is rejected",
    () => insertService({ pricingMode: "usage_based" }),
  );
  await expectRejected(
    "recurring project line item without interval is rejected",
    () => insertService({ pricingMode: "recurring" }),
  );
  await expectRejected(
    "one-time project line item with interval is rejected",
    () => insertService({ recurringInterval: "monthly" }),
  );
  await expectRejected("project line item version = 0 is rejected", () =>
    insertService({ version: 0 }),
  );
  await expectRejected(
    "project line item without a title is rejected",
    () =>
      sql`
      INSERT INTO project_line_items (id, project_id, description, price_cents, pricing_mode,
                                    recurring_interval, version)
      VALUES (${randomUUID()}, ${projectId}, '', 10000, 'one_time', NULL, 1)
    `,
  );
  await expectRejected(
    "project line item without a version is rejected",
    () =>
      sql`
      INSERT INTO project_line_items (id, project_id, title, description, price_cents,
                                    pricing_mode, recurring_interval)
      VALUES (${randomUUID()}, ${projectId}, ${name("No version")}, '', 10000, 'one_time', NULL)
    `,
  );

  // Archiving the template must keep the snapshot and its provenance untouched.
  await sql`UPDATE line_item_templates
            SET status  = 'archived',
                version = 2
            WHERE id = ${templateId}`;
  const survivingRows = (await sql`
    SELECT COUNT(*) ::int AS count
    FROM project_line_items
    WHERE source_line_item_template_id = ${templateId}
  `) as { count: number }[];
  record(
    "archiving a template keeps its project line items and their origin",
    survivingRows[0].count > 0,
    `remaining: ${survivingRows[0].count}`,
  );

  // Deleting the template must null the provenance, never remove the agreed position.
  await sql`DELETE
            FROM line_item_templates
            WHERE id = ${templateId}`;
  const orphanedRows = (await sql`
    SELECT COUNT(*) ::int AS count
    FROM project_line_items
    WHERE project_id = ${projectId}
      AND source_line_item_template_id IS NULL
  `) as { count: number }[];
  record(
    "deleting a template keeps its project line items with a null origin",
    orphanedRows[0].count >= 3,
    `null origins: ${orphanedRows[0].count}`,
  );

  // ON DELETE CASCADE: a project takes its services with it.
  await sql`DELETE
            FROM projects
            WHERE id = ${projectId}`;
  const cascadedRows = (await sql`
    SELECT COUNT(*) ::int AS count
    FROM project_line_items
    WHERE project_id = ${projectId}
  `) as { count: number }[];
  record(
    "deleting a project removes its services",
    cascadedRows[0].count === 0,
    `remaining: ${cascadedRows[0].count}`,
  );
}

/**
 * A task belongs to exactly one project and carries no customer column. Postgres itself refuses a
 * customer-side task that is invisible to the customer and any mismatch between the `done` status
 * and the completion data.
 */
async function runTaskChecks(
  sql: Sql,
  memberId: string,
  name: (suffix: string) => string,
) {
  const customerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Task customer"),
  });
  const projectId = randomUUID();
  await sql`
    INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                          current_process_step, workflow_key, billing_model,
                          included_feedback_rounds, version)
    VALUES (${projectId}, ${customerId}, ${memberId}, ${name("Task project")}, 'active', 'onboarding',
            ARRAY['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)
  `;

  const insertTask = (args: {
    projectId?: string;
    title?: string;
    status?: string;
    actionSide?: string;
    visibleToCustomer?: boolean;
    assigneeMemberId?: string;
    dueOn?: string | null;
    completedAt?: Date | null;
    completedByMemberId?: string | null;
    completedByPortalMembershipId?: string | null;
    version?: number;
  }) => sql`
    INSERT INTO tasks (id, project_id, title, description, status, action_side, visible_to_customer,
                       assignee_member_id, due_on, completed_at, completed_by_member_id,
                       completed_by_portal_membership_id, version)
    VALUES (${randomUUID()}, ${args.projectId ?? projectId}, ${args.title ?? name("Task")}, '',
            ${args.status ?? "open"}, ${args.actionSide ?? "internal"},
            ${args.visibleToCustomer ?? false}, ${args.assigneeMemberId ?? memberId},
            ${args.dueOn ?? null}, ${args.completedAt ?? null}, ${args.completedByMemberId ?? null},
            ${args.completedByPortalMembershipId ?? null}, ${args.version ?? 1})
  `;

  // A real contact membership makes these constraint checks independent of missing-reference failures.
  const membershipId = randomUUID();
  const [member] = (await sql`SELECT user_id
                 FROM workspace_members
                 WHERE id = ${memberId}`) as {
    user_id: string;
  }[];
  const [person] = (await sql`SELECT id
                 FROM people
                 WHERE display_name = ${`${FIXTURE_PREFIX}Person`}`) as {
    id: string;
  }[];
  await sql`
    INSERT INTO customer_contact_assignments (id, customer_id, person_id, is_primary, version)
    VALUES (${randomUUID()}, ${customerId}, ${person.id}, TRUE, 1)
  `;
  await sql`
    INSERT INTO portal_memberships (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled,
                                    version)
    VALUES (${membershipId}, ${customerId}, ${person.id}, ${member.user_id}, NOW(), TRUE, 1)
  `;
  const portalCompletion = {
    status: "done",
    actionSide: "customer",
    visibleToCustomer: true,
    completedAt: new Date(),
    completedByPortalMembershipId: membershipId,
  };
  await expectAccepted(
    "customer task completed by a portal member is accepted",
    () => insertTask(portalCompletion),
  );
  await expectRejected(
    "done task with two completion origins is rejected",
    () => insertTask({ ...portalCompletion, completedByMemberId: memberId }),
    TasksConstraintName.CompletionConsistencyCheck,
  );
  await expectRejected(
    "portal completion of an internal task is rejected",
    () => insertTask({ ...portalCompletion, actionSide: "internal" }),
    TasksConstraintName.PortalCompletionCustomerSideCheck,
  );
  await expectRejected(
    "portal completion without a timestamp is rejected",
    () => insertTask({ ...portalCompletion, completedAt: null }),
    TasksConstraintName.CompletionConsistencyCheck,
  );
  await expectRejected(
    "completion by an unknown portal membership is rejected",
    () =>
      insertTask({
        ...portalCompletion,
        completedByPortalMembershipId: randomUUID(),
      }),
    TasksConstraintName.CompletedByPortalMembershipForeignKey,
  );
  await expectRejected(
    "referenced completion membership cannot be deleted",
    () => sql`DELETE
                FROM portal_memberships
                WHERE id = ${membershipId}`,
    TasksConstraintName.CompletedByPortalMembershipForeignKey,
  );
  await expectAccepted(
    "revocation preserves portal completion history",
    () =>
      sql`UPDATE portal_memberships
              SET revoked_at = NOW(),
                  version = version + 1
              WHERE id = ${membershipId}`,
  );

  await expectAccepted("valid open task is accepted", () => insertTask({}));
  await expectAccepted("valid done task with completion data is accepted", () =>
    insertTask({
      status: "done",
      completedAt: new Date(),
      completedByMemberId: memberId,
    }),
  );
  await expectAccepted("visible customer-side task is accepted", () =>
    insertTask({ actionSide: "customer", visibleToCustomer: true }),
  );
  await expectAccepted("task without a due date is accepted", () =>
    insertTask({ dueOn: null }),
  );
  await expectRejected("task without a project is rejected", () =>
    insertTask({ projectId: randomUUID() }),
  );
  await expectRejected("task with an unknown assignee is rejected", () =>
    insertTask({ assigneeMemberId: randomUUID() }),
  );
  await expectRejected("blank task title is rejected", () =>
    insertTask({ title: "   " }),
  );
  await expectRejected("unknown task status is rejected", () =>
    insertTask({ status: "blocked" }),
  );
  await expectRejected("unknown task action side is rejected", () =>
    insertTask({ actionSide: "partner" }),
  );
  await expectRejected("invisible customer-side task is rejected", () =>
    insertTask({ actionSide: "customer", visibleToCustomer: false }),
  );
  await expectRejected("done task without completion data is rejected", () =>
    insertTask({ status: "done" }),
  );
  await expectRejected("open task with completion data is rejected", () =>
    insertTask({
      status: "open",
      completedAt: new Date(),
      completedByMemberId: memberId,
    }),
  );
  await expectRejected(
    "done task with only a completion time is rejected",
    () => insertTask({ status: "done", completedAt: new Date() }),
    TasksConstraintName.CompletionConsistencyCheck,
  );
  await expectRejected("task version = 0 is rejected", () =>
    insertTask({ version: 0 }),
  );
  await expectRejected(
    "task without a title is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, description, status, action_side, visible_to_customer,
                               assignee_member_id, version)
            VALUES (${randomUUID()}, ${projectId}, '', 'open', 'internal', FALSE, ${memberId}, 1)
          `,
  );
  await expectRejected(
    "task without a status is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, title, description, action_side, visible_to_customer,
                               assignee_member_id, version)
            VALUES (${randomUUID()}, ${projectId}, ${name("No status")}, '', 'internal', FALSE, ${memberId}, 1)
          `,
  );
  await expectRejected(
    "task without an action side is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, title, description, status, visible_to_customer,
                               assignee_member_id, version)
            VALUES (${randomUUID()}, ${projectId}, ${name("No side")}, '', 'open', FALSE, ${memberId}, 1)
          `,
  );
  await expectRejected(
    "task without a visibility flag is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, title, description, status, action_side,
                               assignee_member_id, version)
            VALUES (${randomUUID()}, ${projectId}, ${name("No flag")}, '', 'open', 'internal', ${memberId}, 1)
          `,
  );
  await expectRejected(
    "task without an assignee is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, title, description, status, action_side,
                               visible_to_customer, version)
            VALUES (${randomUUID()}, ${projectId}, ${name("No assignee")}, '', 'open', 'internal', FALSE, 1)
          `,
  );
  await expectRejected(
    "task without a version is rejected",
    () =>
      sql`
            INSERT INTO tasks (id, project_id, title, description, status, action_side,
                               visible_to_customer, assignee_member_id)
            VALUES (${randomUUID()}, ${projectId}, ${name("No version")}, '', 'open', 'internal', FALSE, ${memberId})
          `,
  );

  await sql`DELETE
            FROM projects
            WHERE id = ${projectId}`;
  const orphans = (await sql`
    SELECT COUNT(*) ::int AS count
    FROM tasks
    WHERE project_id = ${projectId}
  `) as { count: number }[];
  record("deleting a project removes its tasks", orphans[0]?.count === 0);
}

async function runLineItemTemplateChecks(
  sql: Sql,
  name: (suffix: string) => string,
) {
  const insertTemplate = (args: {
    title?: string;
    description?: string;
    priceCents?: number;
    pricingMode?: string;
    recurringInterval?: string | null;
    status?: string;
    version?: number;
  }) => sql`
    INSERT INTO line_item_templates (
      id, title, description, price_cents, pricing_mode, recurring_interval, status, version
    )
    VALUES (
      ${randomUUID()}, ${args.title ?? name("Service")}, ${args.description ?? ""},
      ${args.priceCents ?? 10000}, ${args.pricingMode ?? "one_time"},
      ${args.recurringInterval ?? null}, ${args.status ?? "active"}, ${args.version ?? 1}
    )
  `;

  await expectAccepted("valid recurring line item template is accepted", () =>
    insertTemplate({
      pricingMode: "recurring",
      recurringInterval: "monthly",
    }),
  );
  await expectRejected(
    "line item template without a title is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, description, price_cents, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, '', 10000, 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "line item template without a description is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, title, price_cents, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No description")}, 10000, 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "line item template without a price is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, title, description, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No price")}, '', 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "line item template without a pricing mode is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, title, description, price_cents, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No pricing mode")}, '', 10000, NULL, 'active', 1)
    `,
  );
  await expectRejected("blank line item template title is rejected", () =>
    insertTemplate({ title: "   " }),
  );
  await expectRejected("negative line item template price is rejected", () =>
    insertTemplate({ priceCents: -1 }),
  );
  await expectRejected("unknown service pricing mode is rejected", () =>
    insertTemplate({ pricingMode: "usage_based" }),
  );
  await expectRejected(
    "recurring line item template without interval is rejected",
    () => insertTemplate({ pricingMode: "recurring" }),
  );
  await expectRejected(
    "one-time line item template with interval is rejected",
    () => insertTemplate({ recurringInterval: "monthly" }),
  );
  await expectRejected(
    "line item template without status is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, title, description, price_cents, pricing_mode, recurring_interval, version
      )
      VALUES (${randomUUID()}, ${name("No status")}, '', 10000, 'one_time', NULL, 1)
    `,
  );
  await expectRejected(
    "line item template without version is rejected",
    () =>
      sql`
      INSERT INTO line_item_templates (
        id, title, description, price_cents, pricing_mode, recurring_interval, status
      )
      VALUES (${randomUUID()}, ${name("No version")}, '', 10000, 'one_time', NULL, 'active')
    `,
  );
}

/**
 * Guards the "DB defaults are the exception" rule: a business value that is left out
 * must be rejected by Postgres, not silently filled in. Without these checks a later
 * migration could quietly re-add a default and nothing would notice.
 */
async function runMissingDefaultChecks(
  sql: Sql,
  memberId: string,
  personId: string,
  name: (suffix: string) => string,
) {
  await expectRejected(
    "customer without status is rejected",
    () => sql`
      INSERT INTO customers (id, display_name, owner_member_id, version)
      VALUES (${randomUUID()}, ${name("No status")}, ${memberId}, 1)
        `,
  );

  await expectRejected(
    "customer without version is rejected",
    () => sql`
      INSERT INTO customers (id, display_name, status, owner_member_id)
      VALUES (${randomUUID()}, ${name("No version")}, 'active', ${memberId})
        `,
  );

  await expectRejected(
    "person without preferred_locale is rejected",
    () => sql`
            INSERT INTO people (id, display_name, version)
            VALUES (${randomUUID()}, ${name("No locale")}, 1)
        `,
  );

  // The CTE creates a fresh user, so the rejection can only come from the missing member value.
  await expectRejected(
    "member without version is rejected",
    () => sql`
            WITH new_user AS (
                INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
                VALUES (${randomUUID()}, ${name(randomUUID())}, ${name("noversion@example.test")}, ${name("No version")}, TRUE, 1)
                RETURNING id
            )
            INSERT INTO workspace_members (id, user_id, active)
            SELECT ${randomUUID()}, new_user.id, TRUE FROM new_user
        `,
  );

  await expectRejected(
    "member without active flag is rejected",
    () => sql`
            WITH new_user AS (
                INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
                VALUES (${randomUUID()}, ${name(randomUUID())}, ${name("noactive@example.test")}, ${name("No active")}, TRUE, 1)
                RETURNING id
            )
            INSERT INTO workspace_members (id, user_id, version)
            SELECT ${randomUUID()}, new_user.id, 1 FROM new_user
        `,
  );

  await expectRejected(
    "assignment without is_primary is rejected",
    () => sql`
            INSERT INTO customer_contact_assignments (id, customer_id, person_id, version)
            VALUES (${randomUUID()},
                    (SELECT id FROM customers WHERE display_name = ${name("Customer A")} LIMIT 1), ${personId}, 1)
        `,
  );
}

/**
 * The database guarantee `updateVersioned` rests on: an `UPDATE` carrying the version
 * in its `WHERE` matches a row exactly when nobody wrote in between. The helper itself
 * lives in `apps/workspace` and is exercised there by the PostgreSQL integration suite
 * chained from the root `db:smoke:crm` command; `packages/db` must not import from an app.
 */
async function runConcurrencyChecks(
  sql: Sql,
  memberId: string,
  name: (suffix: string) => string,
) {
  const customerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Concurrency"),
  });

  const updateGuarded = (expectedVersion: number, city: string) => sql`
        UPDATE customers
        SET city       = ${city},
            version    = version + 1,
            updated_at = NOW()
        WHERE id = ${customerId}
          AND version = ${expectedVersion} RETURNING version
    `;

  const first = (await updateGuarded(1, "Cologne")) as { version: number }[];
  record(
    "first write against version 1 wins and bumps to 2",
    first.length === 1 && first[0].version === 2,
    `matched: ${first.length}, version: ${first[0]?.version}`,
  );

  const second = (await updateGuarded(1, "Bonn")) as { version: number }[];
  record(
    "second write with the same base version matches no row",
    second.length === 0,
    `matched: ${second.length}`,
  );

  const afterConflict = (await sql`
        SELECT city, version
        FROM customers
        WHERE id = ${customerId}
    `) as { city: string; version: number }[];
  record(
    "the conflict case wrote nothing",
    afterConflict[0].city === "Cologne" && afterConflict[0].version === 2,
    `city: ${afterConflict[0].city}, version: ${afterConflict[0].version}`,
  );

  // Real concurrency: two simultaneous writes against the same version
  const raceCustomerId = await insertCustomer(sql, {
    ownerMemberId: memberId,
    displayName: name("Race"),
  });
  const raceUpdate = (city: string) => sql`
        UPDATE customers
        SET city       = ${city},
            version    = version + 1,
            updated_at = NOW()
        WHERE id = ${raceCustomerId}
          AND version = 1 RETURNING version
    `;
  const [raceA, raceB] = (await Promise.all([
    raceUpdate("A"),
    raceUpdate("B"),
  ])) as { version: number }[][];
  const winners = [raceA, raceB].filter((rows) => rows.length === 1);
  record(
    "two simultaneous writes yield exactly one winner",
    winners.length === 1,
    `winners: ${winners.length}`,
  );

  const afterRace = (await sql`
        SELECT version
        FROM customers
        WHERE id = ${raceCustomerId}
    `) as { version: number }[];
  record(
    "after the race the version is 2, not 3",
    afterRace[0].version === 2,
    `version: ${afterRace[0].version}`,
  );

  // Unknown id matches no row — the helper distinguishes that by re-reading
  const unknown = (await sql`
        UPDATE customers
        SET version = version + 1
        WHERE id = ${randomUUID()}
          AND version = 1 RETURNING version
    `) as { version: number }[];
  record("unknown id matches no row", unknown.length === 0);
}

async function cleanup(sql: Sql) {
  const pattern = `${FIXTURE_PREFIX}%`;
  // Projects take their services with them; the customer delete below then takes the projects.
  await sql`DELETE
              FROM projects
              WHERE customer_id IN (SELECT id FROM customers WHERE display_name LIKE ${pattern})`;
  await sql`DELETE
              FROM line_item_templates
              WHERE title LIKE ${pattern}`;
  await sql`
        DELETE
        FROM customer_contact_assignments
        WHERE customer_id IN (SELECT id FROM customers WHERE display_name LIKE ${pattern})
           OR person_id IN (SELECT id FROM people WHERE display_name LIKE ${pattern})
    `;
  await sql`DELETE
              FROM customers
              WHERE display_name LIKE ${pattern}`;
  await sql`DELETE
              FROM people
              WHERE display_name LIKE ${pattern}`;
  await sql`DELETE
              FROM workspace_members
              WHERE user_id IN (SELECT id FROM users WHERE clerk_user_id LIKE ${pattern})`;
  await sql`DELETE
              FROM users
              WHERE clerk_user_id LIKE ${pattern}`;
}

async function run() {
  const target = parseDatabaseTarget(process.argv);

  if (!target) {
    throw new Error(
      `A database target is required. Allowed: ${ALLOWED_TARGETS.join(", ")}.`,
    );
  }

  if (!ALLOWED_TARGETS.includes(target)) {
    throw new Error(
      `The CRM constraint smoke writes test rows and therefore only runs against ${ALLOWED_TARGETS.join(
        " or ",
      )}, not against "${target}".`,
    );
  }

  configureDatabaseUrlFromTarget(target);

  if (!getDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const sql = getDatabaseClient();

  try {
    await runChecks(sql);
  } finally {
    await cleanup(sql);
  }

  const failed = checks.filter((check) => !check.ok);

  for (const check of checks) {
    const mark = check.ok ? "ok  " : "FAIL";
    const detail = check.detail ? ` — ${check.detail}` : "";
    console.log(`${mark} ${check.name}${detail}`);
  }

  if (failed.length > 0) {
    throw new Error(
      `${failed.length} of ${checks.length} CRM constraint checks failed.`,
    );
  }

  console.log(`\nAll ${checks.length} CRM constraint checks passed.`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
