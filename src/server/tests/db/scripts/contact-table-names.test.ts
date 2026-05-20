import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { leadActivities } from "@invessiv/db/record-configuration/lead-activities";
import { leadCallContacts } from "@invessiv/db/record-configuration/lead-call-contacts";
import { leadCategories } from "@invessiv/db/record-configuration/lead-categories";
import { leadEmailContacts } from "@invessiv/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@invessiv/db/record-configuration/lead-project-requests";
import { leadSocialProfiles } from "@invessiv/db/record-configuration/lead-social-profiles";
import { leadSubmissions } from "@invessiv/db/record-configuration/lead-submissions";
import { leads } from "@invessiv/db/record-configuration/leads";
import { getTableNames } from "@invessiv/db/scripts/contact-table-names";

describe("contact table names", () => {
  it("lists every contact table from the canonical schema", () => {
    const expectedTableNames = [
      leads,
      leadActivities,
      leadCallContacts,
      leadCategories,
      leadEmailContacts,
      leadProjectRequests,
      leadSocialProfiles,
      leadSubmissions,
    ]
      .map((table) => getTableConfig(table).name)
      .sort((left, right) => left.localeCompare(right));

    expect(getTableNames()).toEqual(expectedTableNames);
  });
});
