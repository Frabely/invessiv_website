import { describe, expect, it } from "vitest";
import { validateContactRequest } from "@/lib/forms/contact-request";

describe("validateContactRequest", () => {
  it("returns required errors for empty fields", () => {
    const result = validateContactRequest({
      name: "",
      email: "",
      message: "",
    });

    expect(result.name).toBe("required");
    expect(result.email).toBe("required");
    expect(result.message).toBe("required");
  });

  it("returns invalid_email error for malformed address", () => {
    const result = validateContactRequest({
      name: "Max",
      email: "invalid-email",
      message: "We are planning a relaunch.",
    });

    expect(result.email).toBe("invalid_email");
  });

  it("returns no errors for valid data", () => {
    const result = validateContactRequest({
      name: "Max Mustermann",
      email: "max@example.com",
      message: "We need a new landing page.",
    });

    expect(Object.keys(result)).toHaveLength(0);
  });
});
