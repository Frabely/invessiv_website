import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";

const CONTACT_TABLE_SCHEMAS = [
  {
    table: leads,
    tableName: "leads",
  },
  {
    table: leadSubmissions,
    tableName: "lead_submissions",
  },
  {
    table: leadProjectRequests,
    tableName: "lead_project_requests",
  },
  {
    table: leadEmailContacts,
    tableName: "lead_email_contacts",
  },
  {
    table: leadCallContacts,
    tableName: "lead_call_contacts",
  },
] as const;

describe("contact drizzle schema", () => {
  it.each(CONTACT_TABLE_SCHEMAS)(
    "exposes the expected table config for $tableName",
    ({ table, tableName }) => {
      const tableConfig = getTableConfig(table);

      expect(tableConfig.name).toBe(tableName);
      expect(tableConfig.columns.length).toBeGreaterThan(0);
    },
  );
});
