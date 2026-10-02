// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import {
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  blockFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { OnboardingFormStructure } from "./onboarding-form-structure";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));
const api = vi.hoisted(() => ({
  addBlock: vi.fn(),
  moveBlock: vi.fn(),
  removeBlock: vi.fn(),
  getForm: vi.fn(),
  getFieldUsage: vi.fn(),
  definitionApi: vi.fn(() => ({
    updateBlock: vi.fn(),
    createField: vi.fn(),
    updateField: vi.fn(),
    deleteField: vi.fn(),
    moveField: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => navigation.params,
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: api,
}));

const content = getCrmOnboardingDictionary("de");
const kit = getCrmQuestionnaireDictionary("de");
const text = content.structure;

function block(id: string, title: string, sourceBlockId: string | null) {
  return blockFixture([fieldFixture(`${id}_name`)], {
    id,
    key: id,
    sourceBlockId,
    translations: { de: { title, intro: null } },
  });
}

function form(
  blocks: QuestionnaireBlockDto[],
  overrides: Partial<OnboardingFormDto> = {},
): OnboardingFormDto {
  return {
    id: "f-1",
    customerId: "c-1",
    projectId: "p-1",
    sourceTemplateId: null,
    status: OnboardingFormStatus.Draft,
    createdByMemberId: "m-1",
    releasedAt: null,
    releasedByMemberId: null,
    submittedAt: null,
    submittedByPortalMembershipId: null,
    servicesConfirmedAt: null,
    servicesConfirmedByPortalMembershipId: null,
    servicesNote: null,
    servicesChangedSinceConfirmation: false,
    callHeldOn: null,
    completedAt: null,
    completedByMemberId: null,
    blocks: blocks.map((item, position) => ({
      position,
      reviewStatus: OnboardingBlockReviewStatus.Pending,
      clarificationMode: null,
      reviewNote: null,
      reviewedByMemberId: null,
      reviewedAt: null,
      version: 1,
      block: item,
    })),
    answers: [],
    answerFiles: [],
    hiddenAnswerFiles: [],
    groupEntries: [],
    services: [],
    version: 3,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    ...overrides,
  };
}

function summary(id: string, title: string): QuestionnaireBlockSummaryDto {
  return {
    id,
    key: id,
    titles: { de: title },
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    fieldCount: 1,
    missingLocales: [],
    templateCount: 0,
  };
}

const company = block("company", "Unternehmen", "cat-company");
const brand = block("brand", "Marke", "cat-brand");
const initial = form([company, brand]);

function renderStructure(
  current = initial,
  canWrite = true,
  onFormChangeAction = vi.fn(),
) {
  render(
    <OnboardingFormStructure
      canWrite={canWrite}
      catalogBlocks={[
        summary("cat-company", "Unternehmen"),
        summary("cat-legal", "Rechtliches"),
      ]}
      content={content}
      fixedChoiceLabels={{
        de: { yes: "Ja", no: "Nein" },
        en: { yes: "Yes", no: "No" },
      }}
      form={current}
      locale="de"
      onFormChangeAction={onFormChangeAction}
      questionnaireContent={kit}
    />,
  );
  return onFormChangeAction;
}

function rows() {
  return screen
    .getAllByRole("listitem")
    .map((row) => row.textContent ?? "")
    .map((value) => (value.includes("Unternehmen") ? "company" : "brand"));
}

describe("OnboardingFormStructure", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.params = new URLSearchParams();
    Object.values(api).forEach((mock) => mock.mockClear());
    api.getForm.mockResolvedValue({ ok: true, value: initial });
  });
  afterEach(cleanup);

  it("lists the blocks in form order and asks to pick one", () => {
    renderStructure();
    expect(rows()).toEqual(["company", "brand"]);
    expect(screen.getByText(text.editor.select)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "„Marke“ bearbeiten" }),
    ).toHaveAttribute("href", "/de/crm/onboarding/f-1?block=brand");
  });

  it("opens the kit editor for the block named in the URL", () => {
    navigation.params = new URLSearchParams("block=brand");
    renderStructure();
    expect(screen.queryByText(text.editor.select)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: kit.editor.fields.add }),
    ).toBeInTheDocument();
    expect(api.definitionApi).toHaveBeenCalledWith("f-1");
    expect(
      screen.getByRole("link", { name: "„Marke“ bearbeiten" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("opens nothing for a block id the form does not have", () => {
    navigation.params = new URLSearchParams("block=unknown");
    renderStructure();
    expect(screen.getByText(text.editor.select)).toBeInTheDocument();
  });

  it("moves a block with the form version and adopts the answer", async () => {
    const moved = form([brand, company], { version: 4 });
    api.moveBlock.mockResolvedValue({ ok: true, value: moved });
    const onFormChange = renderStructure();

    fireEvent.click(
      screen.getByRole("button", { name: "„Unternehmen“ nach unten" }),
    );

    await waitFor(() =>
      expect(api.moveBlock).toHaveBeenCalledWith("f-1", "company", {
        direction: 1,
        expectedFormVersion: 3,
      }),
    );
    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(moved));
    expect(rows()).toEqual(["brand", "company"]);
  });

  it("puts a block back and says why when the move is refused", async () => {
    api.moveBlock.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.NotEditable,
    });
    renderStructure();

    fireEvent.click(
      screen.getByRole("button", { name: "„Unternehmen“ nach unten" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.ONBOARDING_NOT_EDITABLE,
    );
    expect(rows()).toEqual(["company", "brand"]);
  });

  it("adopts the current form after a conflict and asks to repeat the change", async () => {
    const current = form([brand], { version: 9 });
    api.moveBlock.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    const onFormChange = renderStructure();

    fireEvent.click(
      screen.getByRole("button", { name: "„Unternehmen“ nach unten" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      text.editor.conflict,
    );
    expect(onFormChange).toHaveBeenCalledWith(current);
    expect(rows()).toEqual(["brand"]);
  });

  it("removes a block only after the confirmation", async () => {
    const remaining = form([brand], { version: 4 });
    api.removeBlock.mockResolvedValue({ ok: true, value: remaining });
    const onFormChange = renderStructure();

    fireEvent.click(
      screen.getByRole("button", { name: "„Unternehmen“ entfernen" }),
    );
    expect(api.removeBlock).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(text.removeDialog.title);
    fireEvent.click(
      within(dialog).getByRole("button", { name: text.removeDialog.confirm }),
    );

    await waitFor(() =>
      expect(api.removeBlock).toHaveBeenCalledWith("f-1", "company", {
        expectedFormVersion: 3,
      }),
    );
    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(remaining));
    expect(rows()).toEqual(["brand"]);
  });

  it("offers only catalog blocks the form does not hold yet and adds the chosen one", async () => {
    const legal = block("legal", "Rechtliches", "cat-legal");
    const extended = form([company, brand, legal], { version: 4 });
    api.addBlock.mockResolvedValue({ ok: true, value: extended });
    renderStructure();

    fireEvent.click(
      screen.getByRole("button", { name: text.blocks.addFromCatalog }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByRole("button", {
        name: "„Unternehmen“ hinzufügen",
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "„Rechtliches“ hinzufügen" }),
    );

    await waitFor(() =>
      expect(api.addBlock).toHaveBeenCalledWith("f-1", {
        catalogBlockId: "cat-legal",
        expectedFormVersion: 3,
      }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(3),
    );
  });

  it("creates an own block and opens it in the editor", async () => {
    const own = block("team_page", "Teamseite", null);
    const extended = form([company, brand, own], { version: 4 });
    api.addBlock.mockResolvedValue({ ok: true, value: extended });
    renderStructure();

    fireEvent.click(screen.getByRole("button", { name: text.blocks.addOwn }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Titel \(Deutsch\)/), {
      target: { value: "Teamseite" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: text.ownDialog.submit }),
    );

    await waitFor(() =>
      expect(api.addBlock).toHaveBeenCalledWith("f-1", {
        key: "teamseite",
        translations: { de: { title: "Teamseite", intro: null } },
        expectedFormVersion: 3,
      }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/de/crm/onboarding/f-1?block=team_page",
        { scroll: false },
      ),
    );
  });

  it("re-reads the form after a write of the block editor, so its version stays current", async () => {
    navigation.params = new URLSearchParams("block=pages");
    const pages = blockFixture(
      [fieldFixture("first"), fieldFixture("second")],
      {
        id: "pages",
        key: "pages",
        translations: { de: { title: "Seiten", intro: null } },
      },
    );
    const refreshed = form([pages], { version: 4 });
    api.getForm.mockResolvedValue({ ok: true, value: refreshed });
    const moveField = vi.fn().mockResolvedValue({
      ok: true,
      value: { ...pages, fields: [...pages.fields].reverse(), version: 2 },
    });
    api.definitionApi.mockReturnValue({
      updateBlock: vi.fn(),
      createField: vi.fn(),
      updateField: vi.fn(),
      deleteField: vi.fn(),
      moveField,
    });
    const onFormChange = renderStructure(form([pages]));

    fireEvent.click(screen.getByRole("button", { name: "„first“ nach unten" }));

    await waitFor(() => expect(moveField).toHaveBeenCalled());

    await waitFor(() => expect(api.getForm).toHaveBeenCalledWith("f-1"));
    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(refreshed));
  });

  it("ignores a re-read that is older than the form it already shows", async () => {
    navigation.params = new URLSearchParams("block=pages");
    const pages = blockFixture(
      [fieldFixture("first"), fieldFixture("second")],
      {
        id: "pages",
        key: "pages",
        translations: { de: { title: "Seiten", intro: null } },
      },
    );
    // The read was answered before a later block list command and arrives after it.
    const outdated = form([pages, brand], { version: 2 });
    api.getForm.mockResolvedValue({ ok: true, value: outdated });
    const moveField = vi.fn().mockResolvedValue({
      ok: true,
      value: { ...pages, fields: [...pages.fields].reverse(), version: 2 },
    });
    api.definitionApi.mockReturnValue({
      updateBlock: vi.fn(),
      createField: vi.fn(),
      updateField: vi.fn(),
      deleteField: vi.fn(),
      moveField,
    });
    const onFormChange = renderStructure(form([pages]));

    fireEvent.click(screen.getByRole("button", { name: "„first“ nach unten" }));

    await waitFor(() => expect(api.getForm).toHaveBeenCalled());
    await waitFor(() => expect(moveField).toHaveBeenCalled());
    expect(onFormChange).not.toHaveBeenCalledWith(outdated);
    expect(
      screen.queryByRole("link", { name: "„Marke“ bearbeiten" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [OnboardingFormStatus.Submitted, true, text.editor.locked],
    [OnboardingFormStatus.Draft, false, text.editor.readOnly],
  ])(
    "shows a %s form without actions when it cannot be changed",
    (status, canWrite, hint) => {
      navigation.params = new URLSearchParams("block=brand");
      renderStructure(form([company, brand], { status }), canWrite);

      expect(screen.getByText(hint)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: text.blocks.addFromCatalog }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: text.blocks.addOwn }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /entfernen/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: kit.editor.fields.add }),
      ).not.toBeInTheDocument();
    },
  );
});

describe("onboarding components", () => {
  it("embed the kit's editor and block list instead of copying them", () => {
    const root = join(process.cwd(), "src/components/workspace/crm/onboarding");
    const sources = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx$/.test(entry.name))
      .filter((entry) => !entry.name.endsWith(".test.tsx"))
      .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"));
    const all = sources.join("\n");

    for (const kitComponent of [
      "questionnaire/editor/questionnaire-block-editor/questionnaire-block-editor",
      "questionnaire/block-list/ordered-block-list-editor/ordered-block-list-editor",
      "questionnaire/block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog",
    ])
      expect(all).toContain(kitComponent);
    // The form brings no field editor of its own.
    expect(all).not.toMatch(/createField|updateField|moveField/);
  });
});
