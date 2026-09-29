import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import { messageFiles, messages } from "@invessiv/db";
import { MessageFilesConstraintName } from "./message-files-constraint-names";
import { MessagesConstraintName } from "./messages-constraint-names";

vi.mock("server-only", () => ({}));

const migration = readFileSync(
  resolve(process.cwd(), "migrations/0043_create_message_files.sql"),
  "utf8",
);

it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(messageFiles);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.uniqueConstraints.map((unique) => unique.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];
  expect(names.sort()).toEqual(
    Object.values(MessageFilesConstraintName).sort(),
  );
  expect(new Set(names).size).toBe(names.length);
  for (const name of names) expect(migration).toContain(name);
  for (const column of configuration.columns) {
    expect(migration).toMatch(new RegExp(`\\b${column.name}\\s`, "i"));
    expect(column.hasDefault).toBe(column.name === "created_at");
  }
});

it("bounds the position by the per-message attachment limit", () => {
  expect(migration).toContain(`position < ${MESSAGE_ATTACHMENTS_MAX}`);
});

it("adds the composite key on messages that attachments reference", () => {
  const unique = getTableConfig(messages).uniqueConstraints.map((constraint) =>
    constraint.getName(),
  );
  expect(unique).toContain(MessagesConstraintName.IdCustomerUnique);
  expect(migration).toContain(MessagesConstraintName.IdCustomerUnique);
});
