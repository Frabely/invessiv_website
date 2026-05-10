import { drizzle } from "drizzle-orm/neon-serverless";
import { describe, expect, it } from "vitest";
import { LEAD_SOURCES_VALUES } from "@/common/constants/leads/sources/lead-sources";
import { sqlCheckIn } from "@/server/db/core";
import * as schema from "@/server/db/record-configuration";
import { leads } from "@/server/db/record-configuration";

const db = drizzle({
  connection: "postgresql://test:test@test.neon.tech/testdb",
  schema,
});

describe("sqlCheckIn", () => {
  it("builds an inline check from trusted readonly const tuples", () => {
    const query = db
      .select({ id: leads.id })
      .from(leads)
      .where(sqlCheckIn(leads.source, LEAD_SOURCES_VALUES))
      .toSQL();

    expect(query.params).toEqual([]);
    expect(query.sql).toContain('"leads"."source" in');
    expect(query.sql).toContain("'webform', 'manual', 'import'");
  });

  it("rejects mutable string arrays at compile time", () => {
    const mutableValues: string[] = ["webform", "manual"];

    // @ts-expect-error sqlCheckIn only accepts trusted readonly const tuples.
    expect(() => sqlCheckIn(leads.source, mutableValues)).not.toThrow();
  });
});
