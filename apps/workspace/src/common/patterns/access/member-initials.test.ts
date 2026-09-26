import { describe, expect, it } from "vitest";

import { getMemberInitials } from "./member-initials";

describe("getMemberInitials", () => {
  it("takes the first letters of the first two name parts", () => {
    expect(getMemberInitials("Moritz Hecht")).toBe("MH");
    expect(getMemberInitials("anna-lena berger schmidt")).toBe("AL");
  });

  it("splits e-mail like names and falls back to a question mark", () => {
    expect(getMemberInitials("ops@invessiv.test")).toBe("OI");
    expect(getMemberInitials("  ")).toBe("?");
  });
});
