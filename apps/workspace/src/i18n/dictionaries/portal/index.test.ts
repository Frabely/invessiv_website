import { describe, expect, it } from "vitest";

import credentialsDe from "./credentials/de.json";
import credentialsEn from "./credentials/en.json";
import dashboardDe from "./dashboard/de.json";
import dashboardEn from "./dashboard/en.json";
import filesDe from "./files/de.json";
import filesEn from "./files/en.json";
import feedbackDe from "./feedback/de.json";
import feedbackEn from "./feedback/en.json";
import invitationDe from "./invitation/de.json";
import invitationEn from "./invitation/en.json";
import messagesDe from "./messages/de.json";
import messagesEn from "./messages/en.json";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import onboardingDe from "./onboarding/de.json";
import onboardingEn from "./onboarding/en.json";
import pickerDe from "./picker/de.json";
import pickerEn from "./picker/en.json";
import shellDe from "./shell/de.json";
import shellEn from "./shell/en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("portal dictionaries", () => {
  it.each([
    ["dashboard", dashboardDe, dashboardEn],
    ["credentials", credentialsDe, credentialsEn],
    ["files", filesDe, filesEn],
    ["feedback", feedbackDe, feedbackEn],
    ["onboarding", onboardingDe, onboardingEn],
    ["invitation", invitationDe, invitationEn],
    ["messages", messagesDe, messagesEn],
    ["meta", metaDe, metaEn],
    ["picker", pickerDe, pickerEn],
    ["shell", shellDe, shellEn],
  ])("%s has identical keys in every locale", (_name, de, en) => {
    expect(keyPaths(en)).toEqual(keyPaths(de));
  });

  it.each([
    ["dashboard", dashboardDe, dashboardEn],
    ["credentials", credentialsDe, credentialsEn],
    ["files", filesDe, filesEn],
    ["feedback", feedbackDe, feedbackEn],
    ["onboarding", onboardingDe, onboardingEn],
    ["shell", shellDe, shellEn],
  ])("%s has no empty texts", (_name, de, en) => {
    for (const text of [JSON.stringify(de), JSON.stringify(en)]) {
      expect(text).not.toContain('""');
    }
  });
});
