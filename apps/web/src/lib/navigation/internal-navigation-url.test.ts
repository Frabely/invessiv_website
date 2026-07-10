import { describe, expect, it } from "vitest";

import {
  createAnchorHistoryUrl,
  createInternalNavigationUrl,
} from "./internal-navigation-url";

describe("internal-navigation-url", () => {
  it("strips generated Google tracking params but keeps intentional query params", () => {
    expect(
      createInternalNavigationUrl(
        "/de",
        "?_gl=1*abc&_up=MQ..&_ga=client&_ga_5T4BC28Z0F=session&gclid=click&wbraid=warm&gbraid=ad&utm_source=google&ref=nav",
        "#hero",
      ),
    ).toBe("/de?utm_source=google&ref=nav#hero");
  });

  it("creates clean anchor history URLs without carrying stale query params", () => {
    expect(
      createAnchorHistoryUrl("/de/services/landing-page", "#contact"),
    ).toBe("/de/services/landing-page#contact");
  });
});
