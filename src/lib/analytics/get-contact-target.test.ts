import { describe, expect, it } from "vitest";
import { getContactTarget } from "./get-contact-target";

describe("getContactTarget", () => {
  it("returns undefined for missing hrefs", () => {
    expect(getContactTarget(null)).toBeUndefined();
  });

  it("detects email and phone targets", () => {
    expect(getContactTarget("mailto:service@invessiv.com")).toBe("email");
    expect(getContactTarget("tel:+49123456789")).toBe("phone");
  });

  it("detects calendly and whatsapp targets case-insensitively", () => {
    expect(
      getContactTarget("https://Calendly.com/service-invessiv-cxf5/30min"),
    ).toBe("calendly");
    expect(getContactTarget("https://example.com/Calendly")).toBe("calendly");
    expect(getContactTarget("https://wa.me/49123456789")).toBe("whatsapp");
    expect(
      getContactTarget("https://WHATSAPP.com/send?phone=49123456789"),
    ).toBe("whatsapp");
  });

  it("returns undefined for unrelated links", () => {
    expect(getContactTarget("/contact")).toBeUndefined();
    expect(getContactTarget("https://invessiv.de")).toBeUndefined();
  });
});
