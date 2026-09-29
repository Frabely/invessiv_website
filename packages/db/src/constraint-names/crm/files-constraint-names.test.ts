import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { files } from "@invessiv/db";
import { FilesConstraintName } from "./files-constraint-names";

vi.mock("server-only", () => ({}));
it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(files);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.uniqueConstraints.map((unique) => unique.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  expect(names.sort()).toEqual(Object.values(FilesConstraintName).sort());
  expect(new Set(names).size).toBe(names.length);
  // 0043 adds the (id, customer_id) key chat attachments reference; 0045 binds files to feedback items.
  const migration = [
    "0041_create_files.sql",
    "0043_create_message_files.sql",
    "0045_create_feedback_rounds.sql",
  ]
    .map((file) =>
      readFileSync(resolve(process.cwd(), "migrations", file), "utf8"),
    )
    .join("\n");
  for (const name of names) expect(migration).toContain(name);
  for (const column of configuration.columns) {
    expect(migration).toMatch(new RegExp(`\\b${column.name}\\s`, "i"));
    expect(column.hasDefault).toBe(
      ["created_at", "updated_at"].includes(column.name),
    );
  }
});
