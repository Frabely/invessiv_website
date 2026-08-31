import { describe, expect, it } from "vitest";
import { createScopedContactMessage } from "@invessiv/common/patterns/contact/scoped-contact-message";

describe("createScopedContactMessage", () => {
  it("puts the scope line above the message", () => {
    expect(
      createScopedContactMessage(
        "Leistungsmodell: Kompakte Website",
        "Wir brauchen eine neue Seite.",
      ),
    ).toBe(
      "Leistungsmodell: Kompakte Website\n\nWir brauchen eine neue Seite.",
    );
  });

  it("keeps the scope line alone when no message was written", () => {
    expect(
      createScopedContactMessage("Leistungsmodell: Landingpage", "   "),
    ).toBe("Leistungsmodell: Landingpage");
  });

  it("falls back to the message when there is no scope line", () => {
    expect(createScopedContactMessage("  ", "Nur eine Frage.")).toBe(
      "Nur eine Frage.",
    );
  });
});
