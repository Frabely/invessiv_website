import { describe, expect, it } from "vitest";

import { createMarketingStructuredData } from "./marketing-structured-data";

describe("marketing-structured-data", () => {
  it("keeps the homepage graph focused on the Invessiv brand", () => {
    const data = createMarketingStructuredData(
      "de",
      "Invessiv entwickelt Landingpages, Webseiten und Prozess-Tools.",
    );

    const organization = data["@graph"].find(
      (entry) => entry["@type"] === "Organization",
    );
    const website = data["@graph"].find((entry) => entry["@type"] === "WebSite");
    const service = data["@graph"].find((entry) => entry["@type"] === "Service");
    const serialized = JSON.stringify(data);

    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "Invessiv",
    });
    expect(organization).toHaveProperty("sameAs");
    expect(website).toMatchObject({
      "@type": "WebSite",
      name: "Invessiv",
    });
    expect(service).toMatchObject({
      "@type": "Service",
      serviceType: "Webentwicklung, Landingpages und Prozess-Tools",
    });
    expect(serialized).not.toContain("Moritz Hecht");
  });
});
