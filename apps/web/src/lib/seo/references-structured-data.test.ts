import { describe, expect, it } from "vitest";
import { getReferencesPageContent } from "@/i18n/dictionaries/marketing/references";
import { SITE_URL } from "@/lib/site-metadata";
import { createReferencesStructuredData } from "./references-structured-data";

function graphEntry<T extends string>(
  data: ReturnType<typeof createReferencesStructuredData>,
  type: T,
) {
  return data["@graph"].find((entry) => entry["@type"] === type);
}

describe("createReferencesStructuredData", () => {
  const content = getReferencesPageContent("de");
  const data = createReferencesStructuredData("de", content);

  it("declares the organization, collection and breadcrumb nodes", () => {
    expect(data["@graph"].map((entry) => entry["@type"])).toEqual([
      "Organization",
      "CollectionPage",
      "BreadcrumbList",
    ]);
  });

  it("lists every visible reference project as a creative work", () => {
    const itemList = graphEntry(data, "CollectionPage")?.mainEntity;

    if (!itemList) {
      throw new Error("Expected the references item list to be available.");
    }

    expect(itemList.numberOfItems).toBe(content.projects.length);
    expect(itemList.itemListElement.map((item) => item.item.url)).toEqual(
      content.projects.map((project) => project.href),
    );
    expect(itemList.itemListElement.map((item) => item.position)).toEqual(
      content.projects.map((_, index) => index + 1),
    );
  });

  it("points the breadcrumb trail at the canonical references URL", () => {
    const breadcrumb = graphEntry(data, "BreadcrumbList");

    if (!breadcrumb?.itemListElement) {
      throw new Error("Expected references breadcrumb items to be available.");
    }

    expect(breadcrumb.itemListElement.at(-1)?.item).toBe(
      `${SITE_URL}/de/references`,
    );
  });

  it("keeps the collection scoped to the projects it is given", () => {
    const reduced = createReferencesStructuredData("de", {
      ...content,
      projects: content.projects.slice(0, 1),
    });

    expect(
      graphEntry(reduced, "CollectionPage")?.mainEntity?.numberOfItems,
    ).toBe(1);
  });
});
