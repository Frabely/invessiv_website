import { describe, expect, it } from "vitest";

import { escapeLikePattern } from "@/common/patterns/crm/sql-like-escape";

describe("escapeLikePattern", () => {
  it("leaves ordinary text untouched", () => {
    expect(escapeLikePattern("Nordlicht GmbH")).toBe("Nordlicht GmbH");
  });

  it("escapes a literal percent sign", () => {
    expect(escapeLikePattern("50% Rabatt")).toBe("50\\% Rabatt");
  });

  it("escapes a literal underscore", () => {
    expect(escapeLikePattern("kunde_1")).toBe("kunde\\_1");
  });

  it("escapes a literal backslash before escaping the character after it", () => {
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });

  it("escapes every wildcard occurrence, not just the first", () => {
    expect(escapeLikePattern("a%b%c_d")).toBe("a\\%b\\%c\\_d");
  });
});
