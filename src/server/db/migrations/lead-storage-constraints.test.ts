import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import {
  CONTACT_BUDGET_KEYS,
  CONTACT_GOAL_KEYS,
  CONTACT_OFFER_KEYS,
  CONTACT_PAGE_KEYS,
  CONTACT_START_KEYS,
  CONTACT_WORKFLOW_KEYS,
} from "@/features/contact/contact-options";
import { CONTACT_SUBMISSION_CHANNELS } from "@/features/contact/contact-request-kind";

const currentFilePath = fileURLToPath(import.meta.url);
const migrationsDirectory = path.dirname(currentFilePath);
const migrationPath = path.join(
  migrationsDirectory,
  "0002_restructure_lead_storage.sql",
);

function getSqlListItems(block: string) {
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function extractCheckList(sql: string, fieldName: string) {
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escapedFieldName}[\\s\\S]*?CHECK\\s*\\(([^]*?)\\)\\s*,`,
    "m",
  );
  const match = sql.match(pattern);

  expect(match, `Missing CHECK constraint for ${fieldName}`).not.toBeNull();
  return getSqlListItems(match?.[1] ?? "");
}

function extractPageKeys(sql: string) {
  const match = sql.match(
    /page_keys\s+TEXT\[]\s*CHECK\s*\(\s*page_keys\s+IS\s+NULL\s+OR[\s\S]*?ARRAY\[([\s\S]*?)]::TEXT\[]/m,
  );

  expect(match, "Missing page_keys array constraint").not.toBeNull();
  return getSqlListItems(match?.[1] ?? "");
}

describe("0002 lead storage constraint drift", () => {
  let sql = "";

  beforeAll(async () => {
    sql = await fs.readFile(migrationPath, "utf8");
  });

  it("keeps offer keys in sync with contact options", () => {
    expect(extractCheckList(sql, "offer_key")).toEqual([...CONTACT_OFFER_KEYS]);
  });

  it("keeps goal keys in sync with contact options", () => {
    expect(extractCheckList(sql, "goal_key")).toEqual([...CONTACT_GOAL_KEYS]);
  });

  it("keeps workflow keys in sync with contact options", () => {
    expect(extractCheckList(sql, "workflow_key")).toEqual([
      ...CONTACT_WORKFLOW_KEYS,
    ]);
  });

  it("keeps budget keys in sync with contact options", () => {
    expect(extractCheckList(sql, "budget_key")).toEqual([
      ...CONTACT_BUDGET_KEYS,
    ]);
  });

  it("keeps preferred start keys in sync with contact options", () => {
    expect(extractCheckList(sql, "preferred_start_key")).toEqual([
      ...CONTACT_START_KEYS,
    ]);
  });

  it("keeps submission channels in sync with contact request constants", () => {
    expect(extractCheckList(sql, "channel")).toEqual([
      ...CONTACT_SUBMISSION_CHANNELS,
    ]);
  });

  it("keeps locales in sync with supported locales", () => {
    expect(extractCheckList(sql, "locale")).toEqual([...SUPPORTED_LOCALES]);
  });

  it("keeps page keys in sync with contact options", () => {
    expect(extractPageKeys(sql)).toEqual([...CONTACT_PAGE_KEYS]);
  });
});
