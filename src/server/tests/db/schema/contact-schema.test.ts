import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { LEAD_CALL_CONTACT_COLUMNS } from "@/server/db/record-configuration/lead-call-contacts";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { LEAD_COLUMNS } from "@/server/db/record-configuration/leads";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { LEAD_EMAIL_CONTACT_COLUMNS } from "@/server/db/record-configuration/lead-email-contacts";
import { LEAD_PROJECT_REQUEST_COLUMNS } from "@/server/db/record-configuration/lead-project-requests";
import { LEAD_SUBMISSION_COLUMNS } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";

const CONTACT_TABLE_SCHEMAS = [
  {
    columns: LEAD_COLUMNS,
    table: leads,
    tableName: "leads",
  },
  {
    columns: LEAD_SUBMISSION_COLUMNS,
    table: leadSubmissions,
    tableName: "lead_submissions",
  },
  {
    columns: LEAD_PROJECT_REQUEST_COLUMNS,
    table: leadProjectRequests,
    tableName: "lead_project_requests",
  },
  {
    columns: LEAD_EMAIL_CONTACT_COLUMNS,
    table: leadEmailContacts,
    tableName: "lead_email_contacts",
  },
  {
    columns: LEAD_CALL_CONTACT_COLUMNS,
    table: leadCallContacts,
    tableName: "lead_call_contacts",
  },
] as const;

describe("contact drizzle schema", () => {
  it.each(CONTACT_TABLE_SCHEMAS)(
    "exposes the expected table config for $tableName",
    ({ columns, table, tableName }) => {
      const tableConfig = getTableConfig(table);

      expect(tableConfig.name).toBe(tableName);
      expect(tableConfig.columns.map((column) => column.name)).toEqual(columns);
    },
  );
});
