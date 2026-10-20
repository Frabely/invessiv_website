/** Deliberately invalid SQL fixtures test database constraints independently of application types. */
import { randomUUID } from "node:crypto";
import { FeedbackRoundItemResultHistoryConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-item-result-history-constraint-names";
import type { CrmSmokeContext } from "./contracts/crm-smoke-context";
import {
  insertFeedbackSmokeItem,
  insertFeedbackSmokeContact,
} from "./feedback-fixtures";

export async function runFeedbackResultHistoryChecks(context: CrmSmokeContext) {
  const { sql, memberId, expectAccepted, expectRejected } = context;
  const { customerId, itemId } = await insertFeedbackSmokeItem(
    context,
    "Result history",
  );
  let version = 0;
  const valid = () => ({
    id: randomUUID(),
    item_id: itemId,
    item_version: ++version,
    event_kind: "set",
    result: "implemented",
    result_note: null,
    result_set_by_member_id: memberId,
    result_set_at: new Date().toISOString(),
    actor_side: "member",
    actor_member_id: memberId,
    actor_portal_membership_id: null,
    occurred_at: new Date().toISOString(),
    command_id: randomUUID(),
    request_version: 1,
  });
  const reset = {
    event_kind: "reset",
    result: null,
    result_note: null,
    result_set_by_member_id: null,
    result_set_at: null,
  };
  const insert = (row: Record<string, string | number | null>) => {
    const columns = Object.keys(row);
    return sql.query(
      `INSERT INTO feedback_round_item_result_history (${columns.join(", ")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})`,
      Object.values(row),
    );
  };
  await expectAccepted("history set", () => insert(valid()));
  await expectAccepted("history baseline", () =>
    insert({
      ...valid(),
      event_kind: "baseline",
      command_id: null,
      request_version: null,
    }),
  );
  await expectAccepted("history member reset", () =>
    insert({ ...valid(), ...reset }),
  );
  await expectAccepted("history removed portal actor", () =>
    insert({
      ...valid(),
      ...reset,
      actor_side: "portal_contact",
      actor_member_id: null,
      command_id: null,
      request_version: null,
    }),
  );
  const invalid: [string, Record<string, string | number | null>, string][] = [
    ["reset snapshot", { event_kind: "reset" }, N.SnapshotCheck],
    ["set snapshot", { result_set_at: null }, N.SnapshotCheck],
    ["missing reply", { result: "not_implemented" }, N.ResultReplyCheck],
    [
      "missing additional reply",
      { result: "additional_service", result_note: "  " },
      N.ResultReplyCheck,
    ],
    ["missing member", { actor_member_id: null }, N.ActorCheck],
    [
      "portal set",
      { actor_side: "portal_contact", actor_member_id: null },
      N.KindActorCheck,
    ],
    ["portal member", { ...reset, actor_side: "portal_contact" }, N.ActorCheck],
    ["baseline command", { event_kind: "baseline" }, N.CommandCheck],
    ["command pair", { request_version: null }, N.CommandCheck],
    ["request version", { request_version: 0 }, N.RequestVersionCheck],
    ["item version", { item_version: 0 }, N.ItemVersionCheck],
    ["event kind", { event_kind: "invalid" }, N.EventKindCheck],
    // An unknown side also violates actor_check, which PostgreSQL evaluates first.
    ["actor side", { actor_side: "invalid" }, N.ActorCheck],
    ["result", { result: "invalid" }, N.ResultCheck],
    ["long note", { result_note: "x".repeat(2001) }, N.ResultNoteLengthCheck],
  ];
  for (const [label, patch, constraint] of invalid)
    await expectRejected(
      `history rejects ${label}`,
      () => insert({ ...valid(), ...patch }),
      constraint,
    );
  const duplicate = valid();
  await insert(duplicate);
  await expectRejected(
    "history duplicate item version",
    () => insert({ ...valid(), item_version: duplicate.item_version }),
    N.ItemVersionUnique,
  );
  await expectRejected(
    "history duplicate command",
    () => insert({ ...valid(), command_id: duplicate.command_id }),
    N.ItemCommandUnique,
  );
  for (const column of [
    "id",
    "item_version",
    "event_kind",
    "actor_side",
    "occurred_at",
  ]) {
    const row: Record<string, string | number | null> = valid();
    delete row[column];
    await expectRejected(`history missing ${column}`, () => insert(row));
  }
  const membershipId = await insertFeedbackSmokeContact(
    context,
    customerId,
    "History",
  );
  const portal = {
    ...valid(),
    ...reset,
    actor_side: "portal_contact",
    actor_member_id: null,
    actor_portal_membership_id: membershipId,
  };
  await insert(portal);
  await expectAccepted(
    "history portal membership deletion preserves the event",
    async () => {
      await sql`DELETE FROM portal_memberships WHERE id = ${membershipId}`;
      const [row] =
        (await sql`SELECT actor_portal_membership_id FROM feedback_round_item_result_history WHERE id = ${portal.id}`) as {
          actor_portal_membership_id: string | null;
        }[];
      if (!row || row.actor_portal_membership_id !== null)
        throw new Error("History actor was not cleared");
    },
  );
  await expectAccepted("history cascades with its item", async () => {
    await sql`DELETE FROM feedback_round_items WHERE id = ${itemId}`;
    const rows =
      (await sql`SELECT id FROM feedback_round_item_result_history WHERE item_id = ${itemId}`) as {
        id: string;
      }[];
    if (rows.length) throw new Error("History did not cascade");
  });
}
