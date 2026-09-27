import { describe, expect, it } from "vitest";
import { PROJECT_PHASE_SEQUENCE } from "@invessiv/common/constants/crm/project-phases";
import { SYSTEM_MESSAGE_KEY_VALUES } from "@invessiv/common/constants/crm/system-message-keys";
import portalDe from "../../../portal/messages/de.json";
import portalEn from "../../../portal/messages/en.json";
import { getCrmMessagesDictionary } from "..";
import de from "./de.json";
import en from "./en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message dictionaries", () => {
  it("keep identical keys in every locale", () => {
    expect(keyPaths(en)).toEqual(keyPaths(de));
    expect(keyPaths(portalEn)).toEqual(keyPaths(portalDe));
  });

  it.each([
    ["workspace de", getCrmMessagesDictionary("de")],
    ["workspace en", getCrmMessagesDictionary("en")],
    ["portal de", portalDe],
    ["portal en", portalEn],
  ])("%s has a text for every system event and project phase", (_, dict) => {
    expect(Object.keys(dict.systemMessages)).toEqual([
      ...SYSTEM_MESSAGE_KEY_VALUES,
    ]);
    expect(Object.keys(dict.phases)).toEqual([...PROJECT_PHASE_SEQUENCE]);
  });
});
