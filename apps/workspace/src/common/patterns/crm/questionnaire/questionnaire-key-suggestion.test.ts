import { describe, expect, it } from "vitest";

import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QUESTIONNAIRE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import {
  nextFreeQuestionnaireKey,
  suggestQuestionnaireKey,
} from "@/common/patterns/crm/questionnaire/questionnaire-key-suggestion";

describe("suggestQuestionnaireKey", () => {
  it.each([
    ["Logos & Corporate Design", "logos_corporate_design"],
    ["Über uns", "ueber_uns"],
    ["Größe der Straße", "groesse_der_strasse"],
    ["  Café Crème  ", "cafe_creme"],
    ["2 Standorte", "f_2_standorte"],
  ])("turns %s into %s", (title, key) => {
    expect(suggestQuestionnaireKey(title)).toBe(key);
    expect(new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE).test(key)).toBe(true);
  });

  it("returns an empty key for text without letters or digits", () => {
    expect(suggestQuestionnaireKey(" – ")).toBe("");
  });

  it("stays within the key length", () => {
    const key = suggestQuestionnaireKey("a".repeat(100));
    expect(key).toHaveLength(QUESTIONNAIRE_LIMITS.keyMaxLength);
  });
});

describe("nextFreeQuestionnaireKey", () => {
  it("counts up until a key is free", () => {
    expect(nextFreeQuestionnaireKey("team", new Set())).toBe("team");
    expect(nextFreeQuestionnaireKey("team", new Set(["team", "team_2"]))).toBe(
      "team_3",
    );
  });
});
