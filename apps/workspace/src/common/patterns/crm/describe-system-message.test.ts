import { describe, expect, it } from "vitest";
import { getCrmMessagesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { describeSystemMessage } from "./describe-system-message";

const content = getCrmMessagesDictionary("de");

describe("describeSystemMessage", () => {
  it("fills the template and translates the phase", () => {
    expect(
      describeSystemMessage(
        {
          body: "projectPhaseChanged",
          metadata: { projectTitle: "Relaunch", phase: "development" },
        },
        content,
      ),
    ).toBe("Projekt „Relaunch“ ist jetzt in der Phase Entwicklung.");
  });

  it("falls back for unknown or missing keys", () => {
    expect(
      describeSystemMessage({ body: "unknown", metadata: null }, content),
    ).toBe(content.thread.systemFallback);
    expect(describeSystemMessage({ body: null, metadata: null }, content)).toBe(
      content.thread.systemFallback,
    );
  });
});
