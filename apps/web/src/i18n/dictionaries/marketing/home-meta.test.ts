import { describe, expect, it } from "vitest";

import { getHomeMetaContent } from "./home-meta";

describe("home-meta", () => {
  it("keeps the German homepage metadata brand-first", () => {
    const content = getHomeMetaContent("de");

    expect(content.title).toBe("Invessiv | Webdesign aus Chemnitz für KMU");
    expect(content.description).toBe(
      "Webdesign aus Chemnitz: Moritz Hecht entwickelt durchdachte Websites für KMU und Dienstleister, die Angebote verständlich vermitteln und Anfragen bringen.",
    );
    expect(content.title.length).toBeLessThanOrEqual(60);
    expect(content.description.length).toBeLessThanOrEqual(160);
  });

  it("keeps the English homepage metadata brand-first", () => {
    const content = getHomeMetaContent("en");

    expect(content.title).toBe("Invessiv | Web Design from Chemnitz for SMBs");
    expect(content.description).toBe(
      "Web design from Chemnitz: Moritz Hecht creates conversion-focused websites for SMBs and service providers that explain offers clearly and bring in inquiries.",
    );
    expect(content.title.length).toBeLessThanOrEqual(60);
    expect(content.description.length).toBeLessThanOrEqual(160);
  });
});
