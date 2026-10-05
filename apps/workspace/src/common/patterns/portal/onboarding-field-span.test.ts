import { describe, expect, it } from "vitest";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireResolvedChoice } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-choice";
import { OnboardingFieldSpan as S } from "@/common/constants/portal/onboarding-field-spans";
import { onboardingFieldSpan } from "@/common/patterns/portal/onboarding-field-span";

function choices(count: number): QuestionnaireResolvedChoice[] {
  return Array.from(
    { length: count },
    (_, index) =>
      ({ id: `c${index}`, label: `C${index}` }) as QuestionnaireResolvedChoice,
  );
}

describe("onboardingFieldSpan", () => {
  it.each([
    [T.ShortText, S.Narrow],
    [T.Email, S.Narrow],
    [T.Phone, S.Narrow],
    [T.Url, S.Narrow],
    [T.Color, S.Narrow],
    [T.YesNo, S.Narrow],
    [T.LongText, S.Narrow],
    [T.Scale, S.Wide],
    [T.Confirmation, S.Wide],
    [T.Group, S.Full],
    [T.Files, S.Full],
    [T.ProjectServices, S.Full],
  ])("gives %s the span %s", (type, expected) => {
    expect(onboardingFieldSpan({ type, choices: [] })).toBe(expected);
  });

  it("widens a choice once its options no longer fit one narrow column", () => {
    expect(onboardingFieldSpan({ type: T.Choice, choices: choices(5) })).toBe(
      S.Narrow,
    );
    expect(
      onboardingFieldSpan({ type: T.MultiChoice, choices: choices(6) }),
    ).toBe(S.Wide);
  });
});
