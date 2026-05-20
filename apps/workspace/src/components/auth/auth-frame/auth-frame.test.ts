import { describe, expect, it } from "vitest";

import { localizeAuthRedirectSearch } from "./auth-frame";

describe("localizeAuthRedirectSearch", () => {
  it("rewrites locale-prefixed redirect_url values when switching locale", () => {
    expect(
      localizeAuthRedirectSearch(
        "?redirect_url=%2Fde%2Fworkspace&after=login",
        "en",
      ),
    ).toBe("?redirect_url=%2Fen%2Fworkspace&after=login");
  });

  it("keeps nested redirect_url query strings intact", () => {
    expect(
      localizeAuthRedirectSearch(
        "?redirect_url=%2Fde%2Fworkspace%3Ftab%3Dleads",
        "en",
      ),
    ).toBe("?redirect_url=%2Fen%2Fworkspace%3Ftab%3Dleads");
  });

  it("does not rewrite external redirect_url values", () => {
    expect(
      localizeAuthRedirectSearch(
        "?redirect_url=https%3A%2F%2Fexample.com%2Fde%2Fworkspace",
        "en",
      ),
    ).toBe("?redirect_url=https%3A%2F%2Fexample.com%2Fde%2Fworkspace");
  });
});
