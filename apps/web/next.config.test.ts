import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

describe("next redirects", () => {
  it("redirects old landing and services URLs permanently", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/de/landing",
          destination: "/de/services/landing-page",
          statusCode: 301,
        },
        {
          source: "/en/landing",
          destination: "/en/services/landing-page",
          statusCode: 301,
        },
        {
          source: "/de/services",
          destination: "/de#services",
          statusCode: 301,
        },
        {
          source: "/en/services",
          destination: "/en#services",
          statusCode: 301,
        },
      ]),
    );
  });
});
