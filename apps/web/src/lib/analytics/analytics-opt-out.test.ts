// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  isAnalyticsOptedOut,
  syncAnalyticsOptOutFromUrl,
} from "./analytics-opt-out";

describe("analytics opt-out", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("opts out via ?analytics=off and back in via ?analytics=on", () => {
    expect(isAnalyticsOptedOut()).toBe(false);

    syncAnalyticsOptOutFromUrl("?analytics=off");
    expect(isAnalyticsOptedOut()).toBe(true);

    syncAnalyticsOptOutFromUrl("?utm_source=linkedin");
    expect(isAnalyticsOptedOut()).toBe(true);

    syncAnalyticsOptOutFromUrl("?analytics=on");
    expect(isAnalyticsOptedOut()).toBe(false);
  });
});
