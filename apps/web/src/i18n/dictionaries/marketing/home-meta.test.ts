import { describe, expect, it } from "vitest";

import { getHomeMetaContent } from "./home-meta";

describe("home-meta", () => {
  it("keeps the German homepage metadata brand-first", () => {
    const content = getHomeMetaContent("de");

    expect(content.title).toBe(
      "Invessiv | Webentwicklung & digitale Lösungen für KMU",
    );
    expect(content.description).toContain("Invessiv");
    expect(content.description).toContain("Webseiten");
    expect(content.description).toContain("Landingpages");
    expect(content.description).toContain("Interne Tools");
    expect(content.description).toContain("interne Abläufe");
    expect(content.description).toContain("Upgrades");
    expect(content.description).not.toContain("Moritz Hecht");
  });

  it("keeps the English homepage metadata brand-first", () => {
    const content = getHomeMetaContent("en");

    expect(content.title).toBe(
      "Invessiv | Web Development & Digital Solutions for SMBs",
    );
    expect(content.description).toContain("Invessiv");
    expect(content.description).toContain("websites");
    expect(content.description).toContain("landing pages");
    expect(content.description).toContain("internal tools");
    expect(content.description).toContain("internal workflows");
    expect(content.description).toContain("upgrades");
    expect(content.description).not.toContain("Moritz Hecht");
  });
});
