import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site-metadata";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes the localized landing pages as indexable canonical routes", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain(`${SITE_URL}/de/services/landing-page`);
    expect(urls).toContain(`${SITE_URL}/en/services/landing-page`);
  });
});
