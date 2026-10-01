import { describe, expect, it } from "vitest";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import {
  changeQuestionnaireFieldType,
  createQuestionnaireFieldFormValues,
  newQuestionnaireChoice,
  questionnairePrefillSourcesFor,
  toQuestionnaireFieldInput,
  validateQuestionnaireFieldForm,
  withQuestionnaireChoiceLabel,
  withQuestionnaireFieldLabel,
} from "@/common/patterns/crm/questionnaire/questionnaire-field-form";

const LABELS = { de: { yes: "Ja", no: "Nein" }, en: { yes: "Yes", no: "No" } };
const T = QuestionnaireFieldType;

function field(
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id: "f-1",
    blockId: "b-1",
    parentFieldId: null,
    key: "company_name",
    position: 0,
    type: T.ShortText,
    requirement: QuestionnaireFieldRequirement.Required,
    maxLength: 120,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: { de: { label: "Firmenname", help: null } },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

describe("questionnaire field form", () => {
  it("starts yes/no with the fixed options labelled in every locale", () => {
    const values = createQuestionnaireFieldFormValues(null, T.YesNo, LABELS);
    expect(values.choices).toEqual([
      { key: "yes", keyEdited: true, labels: { de: "Ja", en: "Yes" } },
      { key: "no", keyEdited: true, labels: { de: "Nein", en: "No" } },
    ]);
  });

  it("round-trips a stored field into the same input", () => {
    const values = createQuestionnaireFieldFormValues(
      field(),
      T.ShortText,
      LABELS,
    );
    expect(toQuestionnaireFieldInput(values)).toEqual({
      key: "company_name",
      requirement: QuestionnaireFieldRequirement.Required,
      maxLength: 120,
      minItems: null,
      maxItems: null,
      acceptedAssetKinds: null,
      prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
      conditionFieldId: null,
      conditionChoiceId: null,
      translations: { de: { label: "Firmenname", help: null } },
      choices: [],
    });
  });

  it("drops settings of another type after a type change", () => {
    const text = createQuestionnaireFieldFormValues(
      field(),
      T.ShortText,
      LABELS,
    );
    const files = changeQuestionnaireFieldType(text, T.Files, LABELS);
    const input = toQuestionnaireFieldInput({
      ...files,
      maxItems: "5",
      acceptedAssetKinds: ["image"],
    });
    expect(input).toMatchObject({
      key: "company_name",
      maxLength: null,
      prefillSource: null,
      maxItems: 5,
      acceptedAssetKinds: ["image"],
    });
  });

  it("suggests the key from the label of the editing locale until the key is edited", () => {
    let values = createQuestionnaireFieldFormValues(null, T.ShortText, LABELS);
    values = withQuestionnaireFieldLabel(values, "en", "Company", "de");
    expect(values.key).toBe("");
    values = withQuestionnaireFieldLabel(
      values,
      "de",
      "Anzahl Mitarbeitende",
      "de",
    );
    expect(values.key).toBe("anzahl_mitarbeitende");
    values = withQuestionnaireFieldLabel(
      { ...values, key: "staff", keyEdited: true },
      "de",
      "Größe",
      "de",
    );
    expect(values.key).toBe("staff");
  });

  it("gives options free keys from their labels", () => {
    let choices = [newQuestionnaireChoice([])];
    choices = [...choices, newQuestionnaireChoice(choices)];
    expect(choices.map((choice) => choice.key)).toEqual([
      "option_1",
      "option_2",
    ]);
    choices = withQuestionnaireChoiceLabel(choices, 0, "de", "E-Mail", "de");
    choices = withQuestionnaireChoiceLabel(choices, 1, "de", "E-Mail", "de");
    expect(choices.map((choice) => choice.key)).toEqual(["e_mail", "e_mail_2"]);
  });

  it("reports missing key, label, numbers and options", () => {
    const values = createQuestionnaireFieldFormValues(
      null,
      T.MultiChoice,
      LABELS,
    );
    expect(
      validateQuestionnaireFieldForm({
        ...values,
        key: "Bad Key",
        minItems: "x",
      }),
    ).toEqual({
      key: QuestionnaireFormValidationCode.Key,
      label: QuestionnaireFormValidationCode.Required,
      minItems: QuestionnaireFormValidationCode.Number,
      choices: QuestionnaireFormValidationCode.MinChoices,
    });
  });

  it("offers each prefill source only for its type", () => {
    expect(questionnairePrefillSourcesFor(T.Email)).toEqual([
      QuestionnairePrefillSource.PrimaryContactEmail,
    ]);
    expect(questionnairePrefillSourcesFor(T.Group)).toEqual([]);
  });
});
