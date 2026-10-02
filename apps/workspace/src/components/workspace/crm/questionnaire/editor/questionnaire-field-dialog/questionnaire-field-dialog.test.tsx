// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import {
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { createQuestionnaireFieldFormValues } from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
import {
  blockFixture,
  choicesFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { QuestionnaireFieldConfigFields } from "../questionnaire-field-config-fields/questionnaire-field-config-fields";
import {
  QuestionnaireFieldDialog,
  type QuestionnaireFieldDialogProps,
} from "./questionnaire-field-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const content = getCrmQuestionnaireDictionary("de");
const text = content.editor.fieldDialog;
const LABELS = { de: { yes: "Ja", no: "Nein" }, en: { yes: "Yes", no: "No" } };
const T = QuestionnaireFieldType;

function api(overrides: Partial<QuestionnaireDefinitionClientApi> = {}) {
  return {
    updateBlock: vi.fn(),
    createField: vi.fn(),
    updateField: vi.fn(),
    deleteField: vi.fn(),
    moveField: vi.fn(),
    ...overrides,
  } satisfies QuestionnaireDefinitionClientApi;
}

function renderDialog(overrides: Partial<QuestionnaireFieldDialogProps> = {}) {
  return render(
    <QuestionnaireFieldDialog
      api={api()}
      block={blockFixture([])}
      content={content}
      field={null}
      fixedChoiceLabels={LABELS}
      locale="de"
      onCloseAction={vi.fn()}
      onConflictAction={vi.fn()}
      onSavedAction={vi.fn()}
      parentFieldId={null}
      {...overrides}
    />,
  );
}

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

  it("submits no condition once its trigger no longer stands above the field", async () => {
    const field = fieldFixture("members", T.ShortText, {
      translations: { de: { label: "Mitglieder", help: null } },
      conditionFieldId: "f-has_team",
      conditionChoiceId: "c-yes",
    });
    const trigger = fieldFixture("has_team", T.YesNo, {
      choices: choicesFixture("yes", "no"),
    });
    const initial = blockFixture([field, trigger]);
    const fake = api({
      updateField: vi.fn().mockResolvedValue({ ok: true, value: initial }),
    });
    renderDialog({ api: fake, block: initial, field });

    fireEvent.click(screen.getByRole("button", { name: text.submitEdit }));

    await waitFor(() =>
      expect(fake.updateField).toHaveBeenCalledWith(
        field.id,
        expect.objectContaining({
          conditionFieldId: null,
          conditionChoiceId: null,
        }),
      ),
    );
  });
});

describe("QuestionnaireFieldDialog", () => {
  afterEach(cleanup);

  it("suggests the key from the question, creates the field and hands the block to its owner", async () => {
    const initial = blockFixture([], { version: 3 });
    const saved = blockFixture([fieldFixture("anzahl_mitarbeitende")], {
      version: 4,
    });
    const fake = api({
      createField: vi.fn().mockResolvedValue({ ok: true, value: saved }),
    });
    const onCloseAction = vi.fn();
    const onSavedAction = vi.fn();
    renderDialog({ api: fake, block: initial, onCloseAction, onSavedAction });

    fireEvent.change(screen.getByLabelText(new RegExp(`^${text.label}`)), {
      target: { value: "Anzahl Mitarbeitende" },
    });
    expect(screen.getByLabelText(new RegExp(`^${text.key}`))).toHaveValue(
      "anzahl_mitarbeitende",
    );
    fireEvent.click(screen.getByRole("button", { name: text.submitCreate }));

    await waitFor(() => expect(onSavedAction).toHaveBeenCalledWith(saved));
    expect(fake.createField).toHaveBeenCalledWith(
      initial.id,
      expect.objectContaining({
        type: T.ShortText,
        key: "anzahl_mitarbeitende",
        parentFieldId: null,
        expectedBlockVersion: 3,
      }),
    );
    expect(onCloseAction).toHaveBeenCalledTimes(1);
  });

  it("blocks the submit without a question", () => {
    const fake = api();
    renderDialog({ api: fake });
    fireEvent.click(screen.getByRole("button", { name: text.submitCreate }));
    expect(fake.createField).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(content.catalog.validation.required),
    ).not.toHaveLength(0);
  });

  it("keeps the type of an existing field fixed", () => {
    const field = fieldFixture("company", T.ShortText, {
      translations: { de: { label: "Firma", help: null } },
    });
    renderDialog({ block: blockFixture([field]), field });
    expect(screen.getByText(text.typeFixed)).toBeInTheDocument();
  });

  it("keeps the input after a conflict and sends the next attempt against the current block", async () => {
    const field = fieldFixture("company", T.ShortText, {
      translations: { de: { label: "Firma", help: null } },
    });
    const current = blockFixture([field], { version: 9 });
    const fake = api({
      updateField: vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          current,
        })
        .mockResolvedValueOnce({ ok: true, value: current }),
    });
    const onCloseAction = vi.fn();
    const onConflictAction = vi.fn();
    renderDialog({
      api: fake,
      block: blockFixture([field], { version: 3 }),
      field,
      onCloseAction,
      onConflictAction,
    });
    fireEvent.change(screen.getByLabelText(new RegExp(`^${text.label}`)), {
      target: { value: "Firmenname" },
    });

    fireEvent.click(screen.getByRole("button", { name: text.submitEdit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(text.conflict);
    expect(onConflictAction).toHaveBeenCalledWith(current);
    expect(onCloseAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText(new RegExp(`^${text.label}`))).toHaveValue(
      "Firmenname",
    );

    fireEvent.click(screen.getByRole("button", { name: text.submitEdit }));

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledTimes(1));
    expect(fake.updateField).toHaveBeenLastCalledWith(
      field.id,
      expect.objectContaining({ expectedBlockVersion: 9 }),
    );
  });

  it("shows why a write was rejected and stays open", async () => {
    const fake = api({
      createField: vi.fn().mockResolvedValue({
        ok: false,
        code: QuestionnaireErrorCode.InvalidCondition,
      }),
    });
    const onCloseAction = vi.fn();
    const onSavedAction = vi.fn();
    renderDialog({ api: fake, onCloseAction, onSavedAction });
    fireEvent.change(screen.getByLabelText(new RegExp(`^${text.label}`)), {
      target: { value: "Firma" },
    });

    fireEvent.click(screen.getByRole("button", { name: text.submitCreate }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.QUESTIONNAIRE_INVALID_CONDITION,
    );
    expect(onSavedAction).not.toHaveBeenCalled();
    expect(onCloseAction).not.toHaveBeenCalled();
  });
});
