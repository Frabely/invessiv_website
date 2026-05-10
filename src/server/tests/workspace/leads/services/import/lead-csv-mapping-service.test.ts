import { describe, expect, it, vi } from "vitest";

import { LeadImportColumnKey } from "@/common/constants/leads/lead-import-column-keys";
import {
  mapHeadersToColumns,
  mapRowToRaw,
} from "@/server/workspace/leads/services/import/lead-csv-mapping-service";

vi.mock("server-only", () => ({}));

describe("mapHeadersToColumns", () => {
  it("maps exact headers and ignores unknown or duplicate headers", () => {
    const result = mapHeadersToColumns([
      "email",
      "Email",
      "first_name",
      "email",
      "category",
      "status",
    ]);

    expect(result.columns).toEqual([
      LeadImportColumnKey.Email,
      null,
      LeadImportColumnKey.FirstName,
      null,
      LeadImportColumnKey.Category,
      LeadImportColumnKey.Status,
    ]);
    expect(result.ignored).toEqual(["Email", "email"]);
  });
});

describe("mapRowToRaw", () => {
  it("trims values, keeps the original email casing and drops empty optional cells", () => {
    const raw = mapRowToRaw(
      [
        LeadImportColumnKey.Email,
        LeadImportColumnKey.FirstName,
        LeadImportColumnKey.LastName,
        LeadImportColumnKey.CompanyName,
        LeadImportColumnKey.ExternalGuid,
        LeadImportColumnKey.Improvements,
      ],
      [
        " Anna.Schmidt@example.com ",
        " Anna ",
        " Schmidt ",
        "  ",
        " lead-001 ",
        " Mehr Sichtbarkeit |   | Klarere CTA ",
      ],
    );

    expect(raw).toEqual({
      email: "Anna.Schmidt@example.com",
      first_name: "Anna",
      last_name: "Schmidt",
      company_name: undefined,
      phone: undefined,
      owner: undefined,
      notes: undefined,
      external_guid: "lead-001",
      website_url: undefined,
      linkedin_url: undefined,
      instagram_url: undefined,
      youtube_url: undefined,
      category: undefined,
      category_id: undefined,
      score: undefined,
      status: undefined,
      improvements: "Mehr Sichtbarkeit |   | Klarere CTA",
    });
  });
});
