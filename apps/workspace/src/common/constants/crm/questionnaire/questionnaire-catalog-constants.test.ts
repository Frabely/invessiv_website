import { describe, expect, it } from "vitest";

import { QuestionnaireApiPath } from "@/common/constants/crm/questionnaire/questionnaire-api-paths";
import {
  QUESTIONNAIRE_BLOCK_PAGE_DIALOG_VALUES,
  QuestionnaireBlockPageDialog,
} from "@/common/constants/crm/questionnaire/questionnaire-block-page-dialogs";
import {
  QUESTIONNAIRE_CATALOG_DIALOG_MODE_VALUES,
  QuestionnaireCatalogDialogMode,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-dialog-modes";
import { QuestionnaireEditorDialogKind } from "@/common/constants/crm/questionnaire/questionnaire-editor-dialog-kinds";
import { QuestionnaireEditorQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-editor-query-params";
import {
  QUESTIONNAIRE_FORM_VALIDATION_CODE_VALUES,
  QuestionnaireFormValidationCode,
} from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import de from "@/i18n/dictionaries/workspace/crm/questionnaire/de.json";
import en from "@/i18n/dictionaries/workspace/crm/questionnaire/en.json";
import { QuestionnaireCatalogQueryParam } from "@/common/constants/crm/questionnaire/questionnaire-catalog-query-params";
import {
  QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES,
  QuestionnaireCatalogStatusFilter,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import {
  QUESTIONNAIRE_CATALOG_TAB_VALUES,
  QuestionnaireCatalogTab,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";

describe("questionnaire catalog constants", () => {
  it("names the api path segments exactly once", () => {
    expect(QuestionnaireApiPath).toEqual({
      Duplicate: "duplicate",
      Fields: "fields",
      Move: "move",
    });
  });

  it("names the page query params without duplicates", () => {
    const values = Object.values(QuestionnaireCatalogQueryParam);
    expect(values).toEqual(["tab", "status", "q", "mode"]);
    expect(new Set(values).size).toBe(values.length);
  });

  it.each([
    [QuestionnaireCatalogTab, QUESTIONNAIRE_CATALOG_TAB_VALUES],
    [
      QuestionnaireCatalogStatusFilter,
      QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES,
    ],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("questionnaire editor constants", () => {
  it.each([
    [QuestionnaireCatalogDialogMode, QUESTIONNAIRE_CATALOG_DIALOG_MODE_VALUES],
    [QuestionnaireBlockPageDialog, QUESTIONNAIRE_BLOCK_PAGE_DIALOG_VALUES],
    [
      QuestionnaireFormValidationCode,
      QUESTIONNAIRE_FORM_VALIDATION_CODE_VALUES,
    ],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });

  it("names the editor dialogs exactly once", () => {
    expect(Object.values(QuestionnaireEditorDialogKind)).toEqual([
      "createField",
      "editField",
      "deleteField",
    ]);
  });

  it("prefixes the editor params so an embedding page keeps its own", () => {
    const values = Object.values(QuestionnaireEditorQueryParam);
    expect(values.every((value) => value.startsWith("questionnaire"))).toBe(
      true,
    );
    expect(new Set(values).size).toBe(values.length);
  });

  it("names every client check in the dictionary", () => {
    for (const locale of [de, en])
      expect(Object.keys(locale.catalog.validation).sort()).toEqual(
        [...QUESTIONNAIRE_FORM_VALIDATION_CODE_VALUES].sort(),
      );
  });
});
