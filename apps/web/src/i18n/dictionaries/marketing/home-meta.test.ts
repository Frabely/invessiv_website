import { describe, expect, it } from "vitest";

import { getHomeMetaContent } from "./home-meta";

describe("home-meta", () => {
  it("keeps the German homepage metadata brand-first", () => {
    const content = getHomeMetaContent("de");

    expect(content.title).toBe(
      "Invessiv | Landingpages für mehr passende Anfragen",
    );
    expect(content.description).toContain("Invessiv");
    expect(content.description).not.toContain("Moritz Hecht");
  });

  it("keeps the English homepage metadata brand-first", () => {
    const content = getHomeMetaContent("en");

    expect(content.title).toBe(
      "Invessiv | Landing Pages for Relevant Inquiries",
    );
    expect(content.description).toContain("Invessiv");
    expect(content.description).not.toContain("Moritz Hecht");
  });
});
