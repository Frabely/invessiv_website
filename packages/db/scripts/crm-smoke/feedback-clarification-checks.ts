import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
/** Deliberately invalid SQL fixtures test database constraints independently of application types. */
import { randomUUID } from "node:crypto";
import { FeedbackRoundItemClarificationsConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-item-clarifications-constraint-names";
import type { CredentialSmokeContext } from "./credential-checks";

export async function runFeedbackClarificationChecks(
  context: CredentialSmokeContext,
) {
  const { sql, memberId, name, expectAccepted, expectRejected } = context;
  const customerId = await context.insertCustomer(
    name("Clarification customer"),
  );
  const projectId = randomUUID(),
    roundId = randomUUID(),
    itemId = randomUUID();
  await sql`INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
    current_process_step, workflow_key, billing_model, included_feedback_rounds, version)
    VALUES (${projectId}, ${customerId}, ${memberId}, ${name("Clarification project")}, 'active', 'onboarding',
      ARRAY ['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)`;
  await sql`INSERT INTO feedback_rounds (id, project_id, customer_id, round_number, status, area_options,
    handed_over_by_member_id, handed_over_at, version)
    VALUES (${roundId}, ${projectId}, ${customerId}, 1, 'open', ARRAY []::text[], ${memberId}, NOW(), 1)`;
  await sql`INSERT INTO feedback_round_items (id, round_id, position, body, version)
    VALUES (${itemId}, ${roundId}, 0, 'Smoke', 1)`;
  const valid = () => ({
    id: randomUUID(),
    item_id: itemId,
    status: "open",
    question: "Which page?",
    requested_by_member_id: memberId,
    requested_at: new Date().toISOString(),
    request_version: 1,
    version: 1,
    answer: null,
    answered_by_portal_membership_id: null,
    answered_at: null,
    answer_command_id: null,
    answer_request_version: null,
    close_note: null,
    closed_by_member_id: null,
    closed_at: null,
    close_command_id: null,
    close_request_version: null,
  });
  const insert = (row: Record<string, string | number | null>) =>
    sql.query(
      `INSERT INTO feedback_round_item_clarifications (${Object.keys(row).join(", ")}) VALUES (${Object.keys(
        row,
      )
        .map((_, i) => `$${i + 1}`)
        .join(", ")})`,
      Object.values(row),
    );
  const answered = {
    status: "answered",
    answer: "Home page",
    answered_at: new Date().toISOString(),
    answer_command_id: randomUUID(),
    answer_request_version: 2,
  };
  const closed = {
    status: "closed",
    close_note: "Clarified by phone",
    closed_by_member_id: memberId,
    closed_at: new Date().toISOString(),
    close_command_id: randomUUID(),
    close_request_version: 2,
  };
  const first = valid();
  await expectAccepted("clarification open", () => insert(first));
  await expectRejected(
    "only one open clarification",
    () => insert(valid()),
    N.OpenItemUnique,
  );
  await sql`DELETE FROM feedback_round_item_clarifications WHERE id = ${first.id}`;
  await expectAccepted("clarification answered", () =>
    insert({ ...valid(), ...answered }),
  );
  await expectAccepted("clarification closed", () =>
    insert({ ...valid(), ...closed }),
  );
  const invalid: [string, Record<string, string | number | null>, string][] = [
    ["unknown item", { item_id: randomUUID() }, N.ItemForeignKey],
    [
      "unknown requesting member",
      { requested_by_member_id: randomUUID() },
      N.RequestedByForeignKey,
    ],
    [
      "unknown answering contact",
      {
        ...answered,
        answer_command_id: randomUUID(),
        answered_by_portal_membership_id: randomUUID(),
      },
      N.AnsweredByForeignKey,
    ],
    [
      "unknown closing member",
      {
        ...closed,
        close_command_id: randomUUID(),
        closed_by_member_id: randomUUID(),
      },
      N.ClosedByForeignKey,
    ],
    ["open with answer", { answer: "No" }, N.StateCheck],
    ["answered without answer", { status: "answered" }, N.StateCheck],
    ["closed without note", { status: "closed" }, N.StateCheck],
    ["answered with closure", { ...answered, close_note: "No" }, N.StateCheck],
    ["closed with answer", { ...closed, answer: "No" }, N.StateCheck],
    ["empty question", { question: "   " }, N.QuestionCheck],
    [
      "long question",
      { question: "a".repeat(FEEDBACK_LIMITS.noteMaxLength + 1) },
      N.QuestionCheck,
    ],
    ["empty answer", { ...answered, answer: " " }, N.AnswerCheck],
    [
      "long answer",
      { ...answered, answer: "a".repeat(FEEDBACK_LIMITS.noteMaxLength + 1) },
      N.AnswerCheck,
    ],
    ["empty close note", { ...closed, close_note: " " }, N.CloseNoteCheck],
    [
      "long close note",
      { ...closed, close_note: "a".repeat(FEEDBACK_LIMITS.noteMaxLength + 1) },
      N.CloseNoteCheck,
    ],
    ["invalid status", { status: "invalid" }, N.StateCheck],
    ["version", { version: 0 }, N.VersionCheck],
    ["request version", { request_version: 0 }, N.RequestVersionCheck],
    [
      "answer request version",
      { ...answered, answer_request_version: 0 },
      N.AnswerRequestVersionCheck,
    ],
    [
      "close request version",
      { ...closed, close_request_version: 0 },
      N.CloseRequestVersionCheck,
    ],
  ];
  for (const [label, patch, constraint] of invalid)
    await expectRejected(
      `clarification rejects ${label}`,
      () => insert({ ...valid(), ...patch }),
      constraint,
    );
  for (const field of [
    "id",
    "item_id",
    "status",
    "question",
    "requested_by_member_id",
    "requested_at",
    "request_version",
    "version",
  ]) {
    const row: Record<string, string | number | null> = valid();
    delete row[field];
    await expectRejected(`clarification missing ${field}`, () => insert(row));
  }
  const duplicateAnswer = {
    ...valid(),
    ...answered,
    answer_command_id: randomUUID(),
  };
  await insert(duplicateAnswer);
  await expectRejected(
    "duplicate answer command",
    () =>
      insert({
        ...valid(),
        ...answered,
        answer_command_id: duplicateAnswer.answer_command_id,
      }),
    N.AnswerCommandUnique,
  );
  const duplicateClose = {
    ...valid(),
    ...closed,
    close_command_id: randomUUID(),
  };
  await insert(duplicateClose);
  await expectRejected(
    "duplicate close command",
    () =>
      insert({
        ...valid(),
        ...closed,
        close_command_id: duplicateClose.close_command_id,
      }),
    N.CloseCommandUnique,
  );
  await expectAccepted("new clarification after an answer", () =>
    insert(valid()),
  );
  const personId = randomUUID(),
    membershipId = randomUUID();
  const [member] =
    (await sql`SELECT user_id FROM workspace_members WHERE id = ${memberId}`) as {
      user_id: string;
    }[];
  await sql`INSERT INTO people (id, display_name, preferred_locale, version) VALUES (${personId}, ${name("Clarification contact")}, 'de', 1)`;
  await sql`INSERT INTO customer_contact_assignments (id, customer_id, person_id, is_primary, version) VALUES (${randomUUID()}, ${customerId}, ${personId}, TRUE, 1)`;
  await sql`INSERT INTO portal_memberships (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
    VALUES (${membershipId}, ${customerId}, ${personId}, ${member.user_id}, NOW(), TRUE, 1)`;
  const portal = {
    ...valid(),
    ...answered,
    answer_command_id: randomUUID(),
    answered_by_portal_membership_id: membershipId,
  };
  await insert(portal);
  await expectAccepted(
    "clarification keeps answer after membership deletion",
    async () => {
      await sql`DELETE FROM portal_memberships WHERE id = ${membershipId}`;
      const [row] =
        (await sql`SELECT answered_by_portal_membership_id, answer FROM feedback_round_item_clarifications WHERE id = ${portal.id}`) as {
          answered_by_portal_membership_id: string | null;
          answer: string;
        }[];
      if (
        !row ||
        row.answered_by_portal_membership_id !== null ||
        row.answer !== portal.answer
      )
        throw new Error("Clarification answer was not preserved");
    },
  );
  await expectAccepted("clarifications cascade with item", async () => {
    await sql`DELETE FROM feedback_round_items WHERE id = ${itemId}`;
    const rows =
      (await sql`SELECT id FROM feedback_round_item_clarifications WHERE item_id = ${itemId}`) as {
        id: string;
      }[];
    if (rows.length) throw new Error("Clarifications did not cascade");
  });
}
