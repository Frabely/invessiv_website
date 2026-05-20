import { describe, expect, it } from "vitest";
import { mapCategoryRowToDto } from "@/server/workspace/leads/services/lead-category/lead-category-mapping-service";

describe("mapCategoryRowToDto", () => {
  it("returns null when category_id is null", () => {
    expect(
      mapCategoryRowToDto({
        category_id: null,
        category_slug: "coaches",
        category_label_key: "leads.categories.coaches",
      }),
    ).toBeNull();
  });

  it("returns null when category_slug is null", () => {
    expect(
      mapCategoryRowToDto({
        category_id: "cat-uuid-1",
        category_slug: null,
        category_label_key: "leads.categories.coaches",
      }),
    ).toBeNull();
  });

  it("returns null when category_label_key is null", () => {
    expect(
      mapCategoryRowToDto({
        category_id: "cat-uuid-1",
        category_slug: "coaches",
        category_label_key: null,
      }),
    ).toBeNull();
  });

  it("returns null when all category fields are null", () => {
    expect(
      mapCategoryRowToDto({
        category_id: null,
        category_slug: null,
        category_label_key: null,
      }),
    ).toBeNull();
  });

  it("returns the correct dto when all fields are present", () => {
    expect(
      mapCategoryRowToDto({
        category_id: "cat-uuid-1",
        category_slug: "coaches",
        category_label_key: "leads.categories.coaches",
      }),
    ).toEqual({
      id: "cat-uuid-1",
      slug: "coaches",
      labelKey: "leads.categories.coaches",
    });
  });
});
