// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { createQuestionnaireFieldFormValues } from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
import {
  blockFixture,
  choicesFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { QuestionnaireFieldConfigFields } from "../questionnaire-field-config-fields/questionnaire-field-config-fields";
import { QuestionnaireFieldDialog } from "./questionnaire-field-dialog";

const content = getCrmQuestionnaireDictionary("de");
const text = content.editor.fieldDialog;
const LABELS = { de: { yes: "Ja", no: "Nein" }, en: { yes: "Yes", no: "No" } };
const T = QuestionnaireFieldType;

function visibleSettings(type: FieldType): string[] {
  render(
    <QuestionnaireFieldConfigFields
      content={content}
      errors={{}}
      onChangeAction={vi.fn()}
      values={createQuestionnaireFieldFormValues(null, type, LABELS)}
    />,
  );
  const labels = [
    text.maxLength,
    text.minItems,
    text.maxItems,
    text.acceptedKinds,
    text.prefill,
  ].filter((label) => screen.queryByText(label) !== null);
  cleanup();
  return labels;
}

describe("QuestionnaireFieldConfigFields", () => {
  afterEach(cleanup);

  it.each([
    [T.ShortText, [text.maxLength, text.prefill]],
    [T.LongText, [text.maxLength, text.prefill]],
    [T.Email, [text.prefill]],
    [T.Phone, [text.prefill]],
    [T.Url, [text.prefill]],
    [T.Choice, []],
    [T.MultiChoice, [text.minItems, text.maxItems]],
    [T.YesNo, []],
    [T.Scale, []],
    [T.Color, []],
    [T.Files, [text.minItems, text.maxItems, text.acceptedKinds]],
    [T.Confirmation, []],
    [T.Group, [text.minItems, text.maxItems]],
    [T.ProjectServices, []],
  ])("shows only the settings of %s", (type, expected) => {
    expect(visibleSettings(type)).toEqual(expected);
  });

  it("covers every field type", () => {
    expect(QUESTIONNAIRE_FIELD_TYPE_VALUES).toHaveLength(14);
  });

  it("submits no condition once its trigger no longer stands above the field", () => {
    const onSubmitAction = vi.fn();
    const field = fieldFixture("members", T.ShortText, {
      translations: { de: { label: "Mitglieder", help: null } },
      conditionFieldId: "f-has_team",
      conditionChoiceId: "c-yes",
    });
    const trigger = fieldFixture("has_team", T.YesNo, {
      choices: choicesFixture("yes", "no"),
    });
    render(
      <QuestionnaireFieldDialog
        block={blockFixture([field, trigger])}
        busy={false}
        conflict
        content={content}
        failure={null}
        field={field}
        fixedChoiceLabels={LABELS}
        locale="de"
        onCloseAction={vi.fn()}
        onSubmitAction={onSubmitAction}
        parentFieldId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: text.submitEdit }));

    expect(onSubmitAction).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionFieldId: null,
        conditionChoiceId: null,
      }),
    );
  });
});

describe("QuestionnaireFieldDialog", () => {
  afterEach(cleanup);

  it("suggests the key from the question and submits the form values", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionnaireFieldDialog
        block={blockFixture([])}
        busy={false}
        conflict={false}
        content={content}
        failure={null}
        field={null}
        fixedChoiceLabels={LABELS}
        locale="de"
        onCloseAction={vi.fn()}
        onSubmitAction={onSubmit}
        parentFieldId={null}
      />,
    );

    fireEvent.change(screen.getByLabelText(new RegExp(`^${text.label}`)), {
      target: { value: "Anzahl Mitarbeitende" },
    });
    expect(screen.getByLabelText(new RegExp(`^${text.key}`))).toHaveValue(
      "anzahl_mitarbeitende",
    );
    fireEvent.click(screen.getByRole("button", { name: text.submitCreate }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: T.ShortText,
        key: "anzahl_mitarbeitende",
      }),
    );
  });

  it("blocks the submit without a question", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionnaireFieldDialog
        block={blockFixture([])}
        busy={false}
        conflict={false}
        content={content}
        failure={null}
        field={null}
        fixedChoiceLabels={LABELS}
        locale="de"
        onCloseAction={vi.fn()}
        onSubmitAction={onSubmit}
        parentFieldId={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: text.submitCreate }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(content.catalog.validation.required),
    ).not.toHaveLength(0);
  });

  it("keeps the type of an existing field fixed and shows a conflict without losing input", () => {
    const field = fieldFixture("company", T.ShortText, {
      translations: { de: { label: "Firma", help: null } },
    });
    render(
      <QuestionnaireFieldDialog
        block={blockFixture([field])}
        busy={false}
        conflict
        content={content}
        failure={null}
        field={field}
        fixedChoiceLabels={LABELS}
        locale="de"
        onCloseAction={vi.fn()}
        onSubmitAction={vi.fn()}
        parentFieldId={null}
      />,
    );
    expect(screen.getByText(text.typeFixed)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(text.conflict);
    expect(screen.getByLabelText(new RegExp(`^${text.label}`))).toHaveValue(
      "Firma",
    );
  });
});
