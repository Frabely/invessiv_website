/** Valid SQL setup shared by the independent feedback constraint checks. */
import { randomUUID } from "node:crypto";
import type { CrmSmokeContext } from "./contracts/crm-smoke-context";

export async function insertFeedbackSmokeItem(
  context: CrmSmokeContext,
  label: string,
) {
  const { sql, memberId, name } = context;
  const customerId = await context.insertCustomer(name(`${label} customer`));
  const projectId = randomUUID(),
    roundId = randomUUID(),
    itemId = randomUUID();
  await sql`INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
    current_process_step, workflow_key, billing_model, included_feedback_rounds, version)
    VALUES (${projectId}, ${customerId}, ${memberId}, ${name(`${label} project`)}, 'active', 'onboarding',
      ARRAY ['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)`;
  await sql`INSERT INTO feedback_rounds (id, project_id, customer_id, round_number, status, area_options,
    handed_over_by_member_id, handed_over_at, version)
    VALUES (${roundId}, ${projectId}, ${customerId}, 1, 'open', ARRAY []::text[], ${memberId}, NOW(), 1)`;
  await sql`INSERT INTO feedback_round_items (id, round_id, position, body, version)
    VALUES (${itemId}, ${roundId}, 0, 'Smoke', 1)`;
  return { customerId, projectId, roundId, itemId };
}

export async function insertFeedbackSmokeContact(
  context: CrmSmokeContext,
  customerId: string,
  label: string,
) {
  const { sql, memberId, name } = context;
  const personId = randomUUID(),
    membershipId = randomUUID();
  const [member] =
    (await sql`SELECT user_id FROM workspace_members WHERE id = ${memberId}`) as {
      user_id: string;
    }[];
  await sql`INSERT INTO people (id, display_name, preferred_locale, version)
    VALUES (${personId}, ${name(`${label} contact`)}, 'de', 1)`;
  await sql`INSERT INTO customer_contact_assignments (id, customer_id, person_id, is_primary, version)
    VALUES (${randomUUID()}, ${customerId}, ${personId}, TRUE, 1)`;
  await sql`INSERT INTO portal_memberships (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
    VALUES (${membershipId}, ${customerId}, ${personId}, ${member.user_id}, NOW(), TRUE, 1)`;
  return membershipId;
}
