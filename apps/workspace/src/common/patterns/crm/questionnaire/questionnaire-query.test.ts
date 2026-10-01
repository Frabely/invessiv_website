import { describe, expect, it } from "vitest";

import { QuestionnaireCatalogDialogMode } from "@/common/constants/crm/questionnaire/questionnaire-catalog-dialog-modes";
import {
  buildQuestionnaireCatalogHref,
  readQuestionnaireCatalogDialogMode,
} from "@/common/patterns/crm/questionnaire/questionnaire-catalog-query";
import { parseQuestionnaireCatalogFilters } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-search-params";
import {
  readQuestionnaireEditorDialog,
  writeQuestionnaireEditorDialog,
} from "@/common/patterns/crm/questionnaire/questionnaire-editor-query";

const BASE = "/de/crm/questionnaire-templates";

describe("questionnaire catalog query", () => {
  it("falls back to the defaults for unknown values", () => {
    expect(
      parseQuestionnaireCatalogFilters({
        tab: "other",
        status: ["archived", "all"],
        q: "  team  ",
      }),
    ).toEqual({ tab: "blocks", status: "active", search: "team" });
  });

  it("keeps only non-default values in the href and round-trips them", () => {
    const filters = {
      tab: "templates",
      status: "all",
      search: "Landing page",
    } as const;
    const href = buildQuestionnaireCatalogHref(BASE, filters);
    expect(href).toBe(`${BASE}?tab=templates&status=all&q=Landing+page`);
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parseQuestionnaireCatalogFilters(params)).toEqual(filters);
    expect(
      buildQuestionnaireCatalogHref(BASE, {
        tab: "blocks",
        status: "active",
        search: "",
      }),
    ).toBe(BASE);
  });

  it("opens a dialog only for a known mode", () => {
    const href = buildQuestionnaireCatalogHref(
      BASE,
      { tab: "blocks", status: "active", search: "" },
      QuestionnaireCatalogDialogMode.CreateBlock,
    );
    expect(href).toBe(`${BASE}?mode=create-block`);
    expect(readQuestionnaireCatalogDialogMode({ mode: "create-block" })).toBe(
      QuestionnaireCatalogDialogMode.CreateBlock,
    );
    expect(readQuestionnaireCatalogDialogMode({ mode: "edit" })).toBeNull();
  });
});

describe("questionnaire editor dialog query", () => {
  it("round-trips every dialog and keeps foreign params", () => {
    const base = new URLSearchParams("project=p-1");
    for (const dialog of [
      { kind: "createField", parentFieldId: null },
      { kind: "createField", parentFieldId: "g-1" },
      { kind: "editField", fieldId: "f-1" },
      { kind: "deleteField", fieldId: "f-1" },
    ] as const) {
      const params = writeQuestionnaireEditorDialog(base, dialog);
      expect(params.get("project")).toBe("p-1");
      expect(readQuestionnaireEditorDialog(params)).toEqual(dialog);
    }
  });

  it("closes by removing only the editor params", () => {
    const open = writeQuestionnaireEditorDialog(new URLSearchParams("tab=x"), {
      kind: "editField",
      fieldId: "f-1",
    });
    const closed = writeQuestionnaireEditorDialog(open, null);
    expect(closed.toString()).toBe("tab=x");
    expect(readQuestionnaireEditorDialog(closed)).toBeNull();
  });
});
