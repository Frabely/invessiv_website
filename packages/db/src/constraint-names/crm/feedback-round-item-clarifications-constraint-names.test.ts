import { FEEDBACK_CLARIFICATION_STATUS_VALUES } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { feedbackRoundItemClarifications } from "@invessiv/db";
import { FeedbackRoundItemClarificationsConstraintName } from "./feedback-round-item-clarifications-constraint-names";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";

vi.mock("server-only", () => ({}));
it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(feedbackRoundItemClarifications);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.uniqueConstraints.map((unique) => unique.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  expect(names.sort()).toEqual(
    Object.values(FeedbackRoundItemClarificationsConstraintName).sort(),
  );
  expect(new Set(names).size).toBe(names.length);
  const migration = readFileSync(
    resolve(
      process.cwd(),
      "migrations",
      "0060_create_feedback_round_item_clarifications.sql",
    ),
    "utf8",
  );
  for (const name of names) expect(migration).toContain(name);
  for (const column of ["question", "answer", "close_note"])
    expect(migration).toContain(
      `length(${column}) <= ${FEEDBACK_LIMITS.noteMaxLength}`,
    );
  expect(migration).toContain(
    `status IN (${FEEDBACK_CLARIFICATION_STATUS_VALUES.map((value) => `'${value}'`).join(", ")})`,
  );
  for (const column of configuration.columns) {
    expect(migration).toMatch(new RegExp(`\\b${column.name}\\s`, "i"));
    expect(column.hasDefault).toBe(
      ["created_at", "updated_at"].includes(column.name),
    );
  }
});
