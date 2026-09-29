import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { feedbackRoundItems } from "@invessiv/db";
import { FeedbackRoundItemsConstraintName } from "./feedback-round-items-constraint-names";

vi.mock("server-only", () => ({}));
it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(feedbackRoundItems);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.uniqueConstraints.map((unique) => unique.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  expect(names.sort()).toEqual(
    Object.values(FeedbackRoundItemsConstraintName).sort(),
  );
  expect(new Set(names).size).toBe(names.length);
  const migration = readFileSync(
    resolve(process.cwd(), "migrations", "0045_create_feedback_rounds.sql"),
    "utf8",
  );
  for (const name of names) expect(migration).toContain(name);
  for (const column of configuration.columns) {
    expect(migration).toMatch(new RegExp(`\\b${column.name}\\s`, "i"));
    expect(column.hasDefault).toBe(
      ["created_at", "updated_at"].includes(column.name),
    );
  }
});
