import { randomUUID } from "node:crypto";
import type { CredentialSmokeContext } from "./credential-checks";
import { ServiceRequestsConstraintName as C } from "@invessiv/db/constraint-names/crm/service-requests-constraint-names";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";

/** Dedicated invalid-write smoke; all SQL below belongs to disposable fixture setup/checks. */
export async function runServiceRequestChecks(context: CredentialSmokeContext) {
  const { sql, memberId, name, expectAccepted, expectRejected } = context;
  const customerId = await context.insertCustomer(name("Service requests"));
  const otherCustomer = await context.insertCustomer(
    name("Foreign service requests"),
  );
  const personId = randomUUID();
  const membershipId = randomUUID();
  const foreignMembership = randomUUID();
  const projectId = randomUUID();
  const foreignProject = randomUUID();
  const [member] =
    (await sql`SELECT user_id FROM workspace_members WHERE id = ${memberId}`) as {
      user_id: string;
    }[];
  await sql`INSERT INTO people(id,display_name,preferred_locale,version) VALUES (${personId},${name("Request contact")},'de',1)`;
  for (const owner of [customerId, otherCustomer]) {
    await sql`INSERT INTO customer_contact_assignments(id,customer_id,person_id,is_primary,version) VALUES (${randomUUID()},${owner},${personId},TRUE,1)`;
    await sql`INSERT INTO portal_memberships(id,customer_id,person_id,user_id,activated_at,email_notifications_enabled,version) VALUES (${owner === customerId ? membershipId : foreignMembership},${owner},${personId},${member.user_id},NOW(),FALSE,1)`;
    await sql`INSERT INTO projects(id,customer_id,owner_member_id,title,status,phase,process_steps,current_process_step,workflow_key,billing_model,included_feedback_rounds,version) VALUES (${owner === customerId ? projectId : foreignProject},${owner},${memberId},${name("Request project")},'active','onboarding',ARRAY['onboarding'],'onboarding','standard_web_v1','fixed_price',0,1)`;
  }
  const row = {
    id: randomUUID(),
    customer_id: customerId,
    kind: "standard",
    title: name("Request"),
    note: "",
    requested_minutes: null as number | null,
    project_wish: "undecided",
    requested_project_id: null as string | null,
    requested_by_membership_id: membershipId,
    status: "requested",
    decline_reason: null as string | null,
    offered_price_cents: null as number | null,
    offered_minutes: null as number | null,
    decided_by_member_id: null as string | null,
    project_id: null as string | null,
    decided_at: null as Date | null,
    idempotency_key: randomUUID(),
    version: 1,
  };
  function insert(overrides: Partial<typeof row> = {}, omit?: string) {
    const entries = Object.entries({
      ...row,
      ...overrides,
      id: randomUUID(),
      idempotency_key: overrides.idempotency_key ?? randomUUID(),
    }).filter(([key]) => key !== omit);
    return sql.query(
      "INSERT INTO service_requests (" +
        entries.map(([key]) => key).join(",") +
        ") VALUES (" +
        entries.map((_, i) => "$" + (i + 1)).join(",") +
        ")",
      entries.map(([, value]) => value),
    );
  }
  await expectAccepted("standard service request", () => insert());
  await expectAccepted("hours service request", () =>
    insert({ kind: "hours", requested_minutes: 300 }),
  );
  await expectRejected(
    "request rejects foreign membership",
    () => insert({ requested_by_membership_id: foreignMembership }),
    C.MembershipForeignKey,
  );
  await expectRejected(
    "request rejects foreign requested project",
    () =>
      insert({
        project_wish: "existing",
        requested_project_id: foreignProject,
      }),
    C.RequestedProjectForeignKey,
  );
  await expectRejected(
    "request rejects foreign result project",
    () =>
      insert({
        status: "accepted",
        project_id: foreignProject,
        decided_at: new Date(),
        decided_by_member_id: memberId,
      }),
    C.ProjectForeignKey,
  );
  await expectRejected(
    "request requires hours quantity",
    () => insert({ kind: "hours" }),
    C.KindMinutesCheck,
  );
  await expectRejected(
    "request refuses standard quantity",
    () => insert({ requested_minutes: 60 }),
    C.KindMinutesCheck,
  );
  await expectRejected(
    "request rejects non-quarter hours",
    () => insert({ kind: "hours", requested_minutes: 20 }),
    C.MinutesCheck,
  );
  await expectRejected(
    "request rejects excessive hours",
    () => insert({ kind: "hours", requested_minutes: 600015 }),
    C.MinutesCheck,
  );
  await expectAccepted("offered hours request keeps the offer", () =>
    insert({
      kind: "hours",
      requested_minutes: 300,
      status: "offered",
      offered_price_cents: 11000,
      offered_minutes: 240,
    }),
  );
  await expectRejected(
    "request rejects a negative offered price",
    () => insert({ status: "offered", offered_price_cents: -1 }),
    C.OfferedPriceCheck,
  );
  await expectRejected(
    "request refuses offered hours on a standard service",
    () => insert({ status: "offered", offered_minutes: 60 }),
    C.OfferedMinutesCheck,
  );
  await expectRejected(
    "request rejects blank title",
    () => insert({ title: " " }),
    C.TitleCheck,
  );
  await expectAccepted("request accepts the longest catalog title", () =>
    insert({ title: "x".repeat(ServiceRequestFieldLimits.TitleMaxLength) }),
  );
  await expectRejected(
    "request rejects a title beyond the catalog limit",
    () =>
      insert({
        title: "x".repeat(ServiceRequestFieldLimits.TitleMaxLength + 1),
      }),
    C.TitleCheck,
  );
  await expectRejected(
    "request rejects long note",
    () => insert({ note: "x".repeat(2001) }),
    C.NoteCheck,
  );
  await expectRejected(
    "request requires existing project wish target",
    () => insert({ project_wish: "existing" }),
    C.WishProjectCheck,
  );
  await expectRejected(
    "request rejects unknown status",
    () => insert({ status: "pending" }),
    C.StatusCheck,
  );
  await expectRejected(
    "accepted request requires decision",
    () => insert({ status: "accepted" }),
    C.AcceptedCheck,
  );
  await expectRejected(
    "declined request requires reason",
    () => insert({ status: "declined", decided_by_member_id: memberId }),
    C.DeclinedCheck,
  );
  await expectRejected(
    "declined request rejects blank reason",
    () =>
      insert({
        status: "declined",
        decline_reason: " ",
        decided_by_member_id: memberId,
      }),
    C.DeclinedCheck,
  );
  await expectRejected(
    "request requires positive version",
    () => insert({ version: 0 }),
    C.VersionCheck,
  );
  const key = randomUUID();
  await insert({ idempotency_key: key });
  await expectRejected(
    "request rejects repeated replay key",
    () => insert({ idempotency_key: key }),
    C.IdempotencyUnique,
  );
  await runMissingDefaultChecks(context, (field) => insert({}, field));
}

async function runMissingDefaultChecks(
  context: CredentialSmokeContext,
  insert: (field: string) => Promise<unknown>,
) {
  for (const field of [
    "kind",
    "title",
    "note",
    "project_wish",
    "requested_by_membership_id",
    "status",
    "idempotency_key",
    "version",
  ]) {
    await context.expectRejected(
      "service request without " + field + " is rejected",
      () => insert(field),
    );
  }
}
