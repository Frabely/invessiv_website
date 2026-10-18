import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { feedbackRoundItemResultHistory } from "@invessiv/db";
import { FeedbackRoundItemResultHistoryConstraintName } from "./feedback-round-item-result-history-constraint-names";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FEEDBACK_ITEM_RESULT_VALUES } from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_RESULT_ACTOR_SIDE_VALUES } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";

vi.mock("server-only", () => ({}));
it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(feedbackRoundItemResultHistory);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.uniqueConstraints.map((unique) => unique.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  expect(names.sort()).toEqual(
    Object.values(FeedbackRoundItemResultHistoryConstraintName).sort(),
  );
  expect(new Set(names).size).toBe(names.length);
  const migration = readFileSync(
    resolve(
      process.cwd(),
      "migrations",
      "0059_create_feedback_round_item_result_history.sql",
    ),
    "utf8",
  );
  for (const name of names) expect(migration).toContain(name);
  expect(migration).toContain(
    `length(result_note) <= ${FEEDBACK_LIMITS.noteMaxLength}`,
  );
  for (const [column, values] of [
    ["result", FEEDBACK_ITEM_RESULT_VALUES],
    ["actor_side", FEEDBACK_RESULT_ACTOR_SIDE_VALUES],
    ["event_kind", FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES],
  ] as const) {
    expect(migration).toContain(
      `${column} IN (${values.map((value) => `'${value}'`).join(", ")})`,
    );
  }
  for (const column of configuration.columns) {
    expect(migration).toMatch(new RegExp(`\\b${column.name}\\s`, "i"));
    expect(column.hasDefault).toBe(["created_at"].includes(column.name));
  }
});
