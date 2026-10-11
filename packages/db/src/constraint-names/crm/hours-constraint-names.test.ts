import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { HOUR_PURCHASE_KIND_VALUES } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HOUR_PURCHASE_SOURCE_VALUES } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import {
  customerHourPurchases,
  projectHourAllocations,
  projectTimeEntries,
  tasks,
} from "@invessiv/db";
import { CustomerHourPurchasesConstraintName } from "./customer-hour-purchases-constraint-names";
import { ProjectHourAllocationsConstraintName } from "./project-hour-allocations-constraint-names";
import { ProjectTimeEntriesConstraintName } from "./project-time-entries-constraint-names";
import { TasksConstraintName } from "./tasks-constraint-names";

vi.mock("server-only", () => ({}));

const migration = readFileSync(
  resolve(process.cwd(), "migrations", "0056_create_hours.sql"),
  "utf8",
);

/** Task 74 widened the source CHECK; the current set of sources is the one written there. */
const sourceMigration = readFileSync(
  resolve(process.cwd(), "migrations", "0058_add_line_item_kinds.sql"),
  "utf8",
);

/** Returns the CREATE TABLE block of one table, so column checks cannot match a sibling table. */
function tableBlock(tableName: string): string {
  const start = migration.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  return migration.slice(start, migration.indexOf("\n);", start));
}

describe.each([
  [
    "customer_hour_purchases",
    customerHourPurchases,
    CustomerHourPurchasesConstraintName,
  ],
  [
    "project_hour_allocations",
    projectHourAllocations,
    ProjectHourAllocationsConstraintName,
  ],
  [
    "project_time_entries",
    projectTimeEntries,
    ProjectTimeEntriesConstraintName,
  ],
] as [string, PgTable, Record<string, string>][])(
  "%s",
  (tableName, table, constraintNames) => {
    it("keeps model and migration aligned without duplicates", () => {
      const configuration = getTableConfig(table);
      const names = [
        ...configuration.checks.map((check) => check.name),
        ...configuration.foreignKeys.map((key) => key.getName()),
        ...configuration.uniqueConstraints.map((unique) => unique.getName()),
        ...configuration.indexes.map((index) => index.config.name),
      ];

      expect(configuration.name).toBe(tableName);
      expect(names.sort()).toEqual(Object.values(constraintNames).sort());
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) expect(migration).toContain(name);

      const block = tableBlock(tableName);
      for (const column of configuration.columns) {
        // One line per column, and nullability matches the model.
        const nullability = column.notNull ? " (PRIMARY KEY|NOT NULL)" : ",$";
        expect(block).toMatch(
          new RegExp(`^\\s+${column.name} [A-Z]+${nullability}`, "m"),
        );
        expect(column.hasDefault).toBe(
          ["created_at", "updated_at"].includes(column.name),
        );
      }
    });
  },
);

it("writes every const value and limit into the migration", () => {
  for (const value of HOUR_PURCHASE_KIND_VALUES)
    expect(migration).toContain(`'${value}'`);
  expect(sourceMigration).toContain(
    `CHECK (source IN (${HOUR_PURCHASE_SOURCE_VALUES.map((value) => `'${value}'`).join(", ")}))`,
  );

  expect(migration).toContain(`minutes % ${HoursLimits.StepMinutes} = 0`);
  expect(migration).toContain(
    `abs(minutes) <= ${HoursLimits.MaxLedgerMinutes}`,
  );
  expect(migration).toContain(`length(note) <= ${HoursLimits.NoteMaxLength}`);
  expect(migration).toContain(
    `duration_minutes <= ${HoursLimits.MaxEntryMinutes}`,
  );
  expect(migration).toContain(
    `length(description) <= ${HoursLimits.DescriptionMaxLength}`,
  );
});

it("gives the task link of a time entry a composite target on tasks", () => {
  const indexes = getTableConfig(tasks).indexes.map(
    (index) => index.config.name,
  );
  expect(indexes).toContain(TasksConstraintName.IdProjectUnique);
  expect(migration).toContain(
    `CREATE UNIQUE INDEX IF NOT EXISTS ${TasksConstraintName.IdProjectUnique} ON tasks (id, project_id);`,
  );
});
