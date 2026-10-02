import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { tasks } from "@invessiv/db";
import { TasksConstraintName as N } from "./tasks-constraint-names";

vi.mock("server-only", () => ({}));

const ONBOARDING_FORM_NAMES = [
  N.OnboardingFormProjectForeignKey,
  N.OnboardingFormSideCheck,
  N.OnboardingFormUnique,
  N.SingleOriginCheck,
];

it("keeps the onboarding form link of tasks aligned between model and migration", () => {
  const configuration = getTableConfig(tasks);
  const modelNames = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  const migration = readFileSync(
    resolve(process.cwd(), "migrations", "0049_add_task_onboarding_form.sql"),
    "utf8",
  );
  for (const name of ONBOARDING_FORM_NAMES) {
    expect(modelNames).toContain(name);
    expect(migration).toContain(name);
  }
  const column = configuration.columns.find(
    (candidate) => candidate.name === "onboarding_form_id",
  );
  expect(column).toMatchObject({ notNull: false, hasDefault: false });
  expect(migration).toMatch(/\bonboarding_form_id\s+UUID;/);
  // The form outlives no purge order: the link must not cascade.
  expect(migration).not.toMatch(/ON DELETE/i);
});
