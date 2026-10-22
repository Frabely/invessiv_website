// @vitest-environment jsdom

import type { BeforeSendEvent } from "@vercel/analytics";
import { afterEach, describe, expect, it } from "vitest";

import { handleAnalyticsBeforeSend } from "./analytics-before-send";

function createEvent(url: string): BeforeSendEvent {
  return { type: "pageview", url };
}

describe("handleAnalyticsBeforeSend", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns a sanitized event without mutating the original", () => {
    const event = createEvent(
      "https://invessiv.com/en/references?ref=newsletter&utm_source=linkedin#case",
    );

    expect(handleAnalyticsBeforeSend(event)).toEqual({
      type: "pageview",
      url: "https://invessiv.com/en/references?utm_source=linkedin",
    });
    expect(event.url).toBe(
      "https://invessiv.com/en/references?ref=newsletter&utm_source=linkedin#case",
    );
  });

  it("drops all events once the visitor opted out", () => {
    expect(
      handleAnalyticsBeforeSend(
        createEvent("https://invessiv.com/de?analytics=off"),
      ),
    ).toBeNull();
    expect(
      handleAnalyticsBeforeSend(createEvent("https://invessiv.com/de")),
    ).toBeNull();
    expect(
      handleAnalyticsBeforeSend(
        createEvent("https://invessiv.com/de?analytics=on"),
      ),
    ).not.toBeNull();
  });
});
