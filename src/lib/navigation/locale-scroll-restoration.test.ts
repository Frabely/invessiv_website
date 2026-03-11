import { describe, expect, it } from "vitest";

import {
  createLocaleScrollRestoreState,
  getLocationUrl,
  matchesLocaleScrollRestoreState,
  parseLocaleScrollRestoreState,
} from "./locale-scroll-restoration";

describe("locale-scroll-restoration", () => {
  it("parses a valid stored restore state", () => {
    const serializedState = createLocaleScrollRestoreState(
      "/en?ref=nav",
      0,
      420,
    );

    expect(parseLocaleScrollRestoreState(serializedState)).toEqual({
      url: "/en?ref=nav",
      x: 0,
      y: 420,
    });
  });

  it("rejects invalid stored restore state", () => {
    expect(
      parseLocaleScrollRestoreState('{"url":"/en","x":"0","y":420}'),
    ).toBeNull();
    expect(parseLocaleScrollRestoreState("not-json")).toBeNull();
  });

  it("matches the current location url including search params", () => {
    const state = {
      url: "/en?ref=nav",
      x: 0,
      y: 420,
    };

    expect(getLocationUrl("/en", "?ref=nav")).toBe("/en?ref=nav");
    expect(
      matchesLocaleScrollRestoreState(state, {
        pathname: "/en",
        search: "?ref=nav",
      }),
    ).toBe(true);
    expect(
      matchesLocaleScrollRestoreState(state, {
        pathname: "/en",
        search: "",
      }),
    ).toBe(false);
  });
});
