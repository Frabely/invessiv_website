import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { SECURITY_EVENT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-event-types";
import { SECURITY_SUBJECT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-subject-types";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CREDENTIAL_SIDE_VALUES } from "@invessiv/common/constants/credentials/credential-sides";
import { CREDENTIAL_TYPE_VALUES } from "@invessiv/common/constants/credentials/credential-types";
import { customerCredentials } from "@invessiv/db";
import { CustomerCredentialsConstraintName } from "./customer-credentials-constraint-names";

vi.mock("server-only", () => ({}));

const migration = readFileSync(
  resolve(process.cwd(), "migrations", "0054_create_customer_credentials.sql"),
  "utf8",
);

it("keeps model and migration constraint names aligned without duplicates", () => {
  const configuration = getTableConfig(customerCredentials);
  const names = [
    ...configuration.checks.map((check) => check.name),
    ...configuration.foreignKeys.map((key) => key.getName()),
    ...configuration.indexes.map((index) => index.config.name),
  ];

  expect(names.sort()).toEqual(
    Object.values(CustomerCredentialsConstraintName).sort(),
  );
  expect(new Set(names).size).toBe(names.length);
  for (const name of names) expect(migration).toContain(name);
  for (const column of configuration.columns) {
    // One line per column, and nullability matches the model.
    const nullability = column.notNull ? " (PRIMARY KEY|NOT NULL)" : ",$";
    expect(migration).toMatch(
      new RegExp(`^\\s+${column.name} [A-Z]+${nullability}`, "m"),
    );
    expect(column.hasDefault).toBe(
      ["created_at", "updated_at"].includes(column.name),
    );
  }
});

it("writes every const value and limit into the migration", () => {
  for (const value of [
    ...CREDENTIAL_TYPE_VALUES,
    ...CREDENTIAL_SIDE_VALUES,
    ...SECURITY_EVENT_TYPE_VALUES,
    ...SECURITY_SUBJECT_TYPE_VALUES,
  ])
    expect(migration).toContain(`'${value}'`);

  expect(migration).toContain(`length(title) <= ${CREDENTIAL_LIMITS.titleMax}`);
  expect(migration).toContain(`length(url) <= ${CREDENTIAL_LIMITS.urlMax}`);
  expect(migration).toContain(
    `length(username) <= ${CREDENTIAL_LIMITS.usernameMax}`,
  );
});
