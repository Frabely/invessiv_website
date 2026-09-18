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
async function expectRejected(name: string, run: () => Promise<unknown>) {
  try {
    await run();
    record(name, false, "was accepted, expected a rejection");
  } catch {
    record(name, true);
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
  await runServiceTemplateChecks(sql, name);
  await runConcurrencyChecks(sql, memberId, name);
}

async function runServiceTemplateChecks(
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
    INSERT INTO service_templates (
      id, title, description, price_cents, pricing_mode, recurring_interval, status, version
    )
    VALUES (
      ${randomUUID()}, ${args.title ?? name("Service")}, ${args.description ?? ""},
      ${args.priceCents ?? 10000}, ${args.pricingMode ?? "one_time"},
      ${args.recurringInterval ?? null}, ${args.status ?? "active"}, ${args.version ?? 1}
    )
  `;

  await expectAccepted("valid recurring service template is accepted", () =>
    insertTemplate({
      pricingMode: "recurring",
      recurringInterval: "monthly",
    }),
  );
  await expectRejected(
    "service template without a title is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
        id, description, price_cents, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, '', 10000, 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "service template without a description is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
        id, title, price_cents, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No description")}, 10000, 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "service template without a price is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
        id, title, description, pricing_mode, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No price")}, '', 'one_time', NULL, 'active', 1)
    `,
  );
  await expectRejected(
    "service template without a pricing mode is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
        id, title, description, price_cents, recurring_interval, status, version
      )
      VALUES (${randomUUID()}, ${name("No pricing mode")}, '', 10000, NULL, 'active', 1)
    `,
  );
  await expectRejected("blank service template title is rejected", () =>
    insertTemplate({ title: "   " }),
  );
  await expectRejected("negative service template price is rejected", () =>
    insertTemplate({ priceCents: -1 }),
  );
  await expectRejected("unknown service pricing mode is rejected", () =>
    insertTemplate({ pricingMode: "usage_based" }),
  );
  await expectRejected(
    "recurring service template without interval is rejected",
    () => insertTemplate({ pricingMode: "recurring" }),
  );
  await expectRejected(
    "one-time service template with interval is rejected",
    () => insertTemplate({ recurringInterval: "monthly" }),
  );
  await expectRejected(
    "service template without status is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
        id, title, description, price_cents, pricing_mode, recurring_interval, version
      )
      VALUES (${randomUUID()}, ${name("No status")}, '', 10000, 'one_time', NULL, 1)
    `,
  );
  await expectRejected(
    "service template without version is rejected",
    () =>
      sql`
      INSERT INTO service_templates (
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
  await sql`DELETE
              FROM service_templates
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
