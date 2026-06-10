import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site-metadata";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes the localized service pages as indexable canonical routes", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(`${SITE_URL}/de/services/landing-page`);
    expect(urls).toContain(`${SITE_URL}/en/services/landing-page`);
    expect(urls).toContain(`${SITE_URL}/de/services/linkedin-post`);
    expect(urls).toContain(`${SITE_URL}/en/services/linkedin-post`);
    expect(
      entries.find(
        (entry) => entry.url === `${SITE_URL}/de/services/linkedin-post`,
      ),
    ).toEqual({
      url: `${SITE_URL}/de/services/linkedin-post`,
    });
  });
});
