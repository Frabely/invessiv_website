import { describe, expect, it } from "vitest";

import { getHomeMetaContent } from "./home-meta";

describe("home-meta", () => {
  it("keeps the German homepage metadata brand-first", () => {
    const content = getHomeMetaContent("de");

    expect(content.title).toBe(
      "Invessiv | Moritz Hecht – Webdesign aus Chemnitz",
    );
    expect(content.description).toBe(
      "Webdesign in Chemnitz von Moritz Hecht: Invessiv entwickelt professionelle Websites und Landingpages, die Angebote verständlich vermitteln und Anfragen bringen.",
    );
    expect(content.serviceName).toBe("Webdesign und Landingpages aus Chemnitz");
    expect(content.serviceType).toBe(
      "Webdesign, Landingpages und Website-Betreuung",
    );
    expect(content.title.length).toBeLessThanOrEqual(60);
    expect(content.description.length).toBeLessThanOrEqual(160);
  });

  it("keeps the English homepage metadata brand-first", () => {
    const content = getHomeMetaContent("en");

    expect(content.title).toBe(
      "Invessiv | Moritz Hecht – Web Design from Chemnitz",
    );
    expect(content.description).toBe(
      "Web design in Chemnitz by Moritz Hecht: Invessiv creates professional websites and landing pages that communicate offers clearly and generate inquiries.",
    );
    expect(content.serviceName).toBe(
      "Web design and landing pages from Chemnitz",
    );
    expect(content.serviceType).toBe(
      "Web design, landing pages and website support",
    );
    expect(content.title.length).toBeLessThanOrEqual(60);
    expect(content.description.length).toBeLessThanOrEqual(160);
  });
});
