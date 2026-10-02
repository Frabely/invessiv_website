import { describe, expect, it } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { ONBOARDING_FORM_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import { validateQuestionnaireBlockIdentity } from "@/common/patterns/crm/questionnaire/questionnaire-block-identity";
import { getCrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { detectOnboardingBlockListChange } from "./onboarding-block-list-change";
import { onboardingFormErrorText } from "./onboarding-form-error-text";
import {
  buildOnboardingFormHref,
  buildOnboardingFormTabHref,
  defaultOnboardingFormTab,
  readOnboardingFormBlockId,
  readOnboardingFormTab,
} from "./onboarding-form-query";

describe("detectOnboardingBlockListChange", () => {
  it("names the block that moved down when two neighbours swap", () => {
    expect(
      detectOnboardingBlockListChange(["a", "b", "c"], ["a", "c", "b"]),
    ).toEqual({ kind: "move", blockId: "b", direction: 1 });
  });

  it("names the removed block", () => {
    expect(
      detectOnboardingBlockListChange(["a", "b", "c"], ["a", "c"]),
    ).toEqual({ kind: "remove", blockId: "b" });
  });

  it("answers null for an unchanged list and for anything it cannot name", () => {
    expect(detectOnboardingBlockListChange(["a", "b"], ["a", "b"])).toBeNull();
    expect(
      detectOnboardingBlockListChange(["a", "b", "c"], ["c", "b", "a"]),
    ).toBeNull();
    expect(detectOnboardingBlockListChange(["a"], ["a", "b"])).toBeNull();
  });
});

describe("onboarding form tab query", () => {
  it("reads the tab and falls back to the structure for anything unknown", () => {
    expect(readOnboardingFormTab(new URLSearchParams("tab=answers"))).toBe(
      "answers",
    );
    expect(readOnboardingFormTab(new URLSearchParams("tab=nope"))).toBe(
      "structure",
    );
    expect(readOnboardingFormTab(new URLSearchParams(""))).toBe("structure");
  });

  it("sets the tab, drops the default one and keeps every other param", () => {
    expect(
      buildOnboardingFormTabHref(
        "/de/crm/onboarding/f-1",
        "block=b-1",
        "answers",
      ),
    ).toBe("/de/crm/onboarding/f-1?block=b-1&tab=answers");
    expect(
      buildOnboardingFormTabHref(
        "/de/crm/onboarding/f-1",
        "tab=answers&block=b-1",
        "structure",
      ),
    ).toBe("/de/crm/onboarding/f-1?block=b-1");
    expect(
      buildOnboardingFormTabHref(
        "/de/crm/onboarding/f-1",
        "tab=answers",
        "structure",
      ),
    ).toBe("/de/crm/onboarding/f-1");
  });
});

describe("onboarding form default tab", () => {
  it("opens a completed form on its answers and every other one on its structure", () => {
    expect(
      ONBOARDING_FORM_STATUS_VALUES.map((status) => [
        status,
        defaultOnboardingFormTab(status),
      ]),
    ).toEqual([
      ["draft", "structure"],
      ["open", "structure"],
      ["submitted", "structure"],
      ["changes_requested", "structure"],
      ["completed", "answers"],
    ]);
  });

  it("reads and builds the tab against the default it is given", () => {
    expect(readOnboardingFormTab(new URLSearchParams(""), "answers")).toBe(
      "answers",
    );
    expect(
      readOnboardingFormTab(new URLSearchParams("tab=structure"), "answers"),
    ).toBe("structure");
    expect(
      buildOnboardingFormTabHref(
        "/de/crm/onboarding/f-1",
        "tab=structure",
        "answers",
        "answers",
      ),
    ).toBe("/de/crm/onboarding/f-1");
    expect(
      buildOnboardingFormTabHref(
        "/de/crm/onboarding/f-1",
        "",
        "structure",
        "answers",
      ),
    ).toBe("/de/crm/onboarding/f-1?tab=structure");
  });
});

describe("onboarding form query", () => {
  it("reads the selected block and ignores an empty value", () => {
    expect(
      readOnboardingFormBlockId(new URLSearchParams("tab=structure&block=b-1")),
    ).toBe("b-1");
    expect(readOnboardingFormBlockId(new URLSearchParams("block="))).toBeNull();
  });

  it("sets or clears the block and keeps every other param", () => {
    expect(
      buildOnboardingFormHref("/de/crm/onboarding/f-1", "tab=structure", "b 1"),
    ).toBe("/de/crm/onboarding/f-1?tab=structure&block=b+1");
    expect(
      buildOnboardingFormHref(
        "/de/crm/onboarding/f-1",
        "block=b-1&questionnaireField=x",
        null,
      ),
    ).toBe("/de/crm/onboarding/f-1?questionnaireField=x");
    expect(
      buildOnboardingFormHref("/de/crm/onboarding/f-1", "block=b-1", null),
    ).toBe("/de/crm/onboarding/f-1");
  });
});

describe("onboardingFormErrorText", () => {
  const texts = {
    onboarding: getCrmOnboardingDictionary("de").errors,
    questionnaire: getCrmQuestionnaireDictionary("de").errors,
  };

  it("takes form codes from the onboarding texts and kit codes from the kit", () => {
    expect(
      onboardingFormErrorText(OnboardingErrorCode.NotEditable, texts),
    ).toBe(texts.onboarding.ONBOARDING_NOT_EDITABLE);
    expect(
      onboardingFormErrorText(QuestionnaireErrorCode.KeyTaken, texts),
    ).toBe(texts.questionnaire.QUESTIONNAIRE_KEY_TAKEN);
  });

  it("uses the onboarding text for the codes both sets share", () => {
    expect(onboardingFormErrorText(OnboardingErrorCode.Internal, texts)).toBe(
      texts.onboarding.INTERNAL,
    );
  });
});

describe("validateQuestionnaireBlockIdentity", () => {
  it("accepts a title and a well-formed key", () => {
    expect(
      validateQuestionnaireBlockIdentity({ title: " Team ", key: "team_page" }),
    ).toEqual({});
  });

  it("requires both and checks the key pattern", () => {
    expect(
      validateQuestionnaireBlockIdentity({ title: "  ", key: "" }),
    ).toEqual({
      title: QuestionnaireFormValidationCode.Required,
      key: QuestionnaireFormValidationCode.Required,
    });
    expect(
      validateQuestionnaireBlockIdentity({ title: "Team", key: "Team Page" }),
    ).toEqual({ key: QuestionnaireFormValidationCode.Key });
  });
});
