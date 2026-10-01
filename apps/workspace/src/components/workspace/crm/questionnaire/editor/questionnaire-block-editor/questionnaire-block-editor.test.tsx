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
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  blockFixture,
  choicesFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { QuestionnaireBlockEditor } from "./questionnaire-block-editor";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace, refresh: vi.fn() }),
  usePathname: () => "/de/crm/questionnaire-templates/blocks/b-1",
  useSearchParams: () => navigation.params,
}));

const content = getCrmQuestionnaireDictionary("de");
const LABELS = { de: { yes: "Ja", no: "Nein" }, en: { yes: "Yes", no: "No" } };

function withLabels(label: string) {
  return { de: { label, help: null } };
}

function block(): QuestionnaireBlockDto {
  return blockFixture(
    [
      fieldFixture("has_team", QuestionnaireFieldType.YesNo, {
        translations: withLabels("Gibt es ein Team?"),
        choices: choicesFixture("yes", "no"),
      }),
      fieldFixture("members", QuestionnaireFieldType.Group, {
        translations: withLabels("Teammitglieder"),
        conditionFieldId: "f-has_team",
        conditionChoiceId: "c-yes",
        children: [
          fieldFixture("name", QuestionnaireFieldType.ShortText, {
            parentFieldId: "f-members",
            translations: withLabels("Name"),
          }),
        ],
      }),
    ],
    { version: 3 },
  );
}

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

function renderEditor(
  fake: QuestionnaireDefinitionClientApi,
  canWrite = true,
  initial = block(),
) {
  return render(
    <QuestionnaireBlockEditor
      api={fake}
      block={initial}
      canWrite={canWrite}
      content={content}
      fixedChoiceLabels={LABELS}
      locale="de"
      showStatus
    />,
  );
}

describe("QuestionnaireBlockEditor", () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.params = new URLSearchParams();
  });
  afterEach(cleanup);

  it("shows groups with their sub-fields and conditions as readable text", () => {
    renderEditor(api());
    expect(screen.getByText("Teammitglieder")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(
      screen.getByText("Nur wenn „Gibt es ein Team?“ = „YES“"),
    ).toBeInTheDocument();
  });

  it("sends the block version with a move and announces the new position", async () => {
    const moved = block();
    moved.fields = [
      { ...moved.fields[1]!, position: 0 },
      { ...moved.fields[0]!, position: 1 },
    ];
    moved.version = 4;
    const fake = api({
      moveField: vi.fn().mockResolvedValue({ ok: true, value: moved }),
    });
    renderEditor(fake);

    fireEvent.click(
      screen.getByRole("button", { name: "„Gibt es ein Team?“ nach unten" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("„Gibt es ein Team?“ steht jetzt an Position 2."),
      ).toBeInTheDocument(),
    );
    expect(fake.moveField).toHaveBeenCalledWith("f-has_team", {
      direction: 1,
      expectedBlockVersion: 3,
    });
  });

  it("adopts the current block after a conflict and says so", async () => {
    const current = { ...block(), version: 9 };
    const fake = api({
      moveField: vi.fn().mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current,
      }),
      deleteField: vi.fn().mockResolvedValue({
        ok: false,
        code: QuestionnaireErrorCode.InvalidCondition,
      }),
    });
    renderEditor(fake);

    fireEvent.click(
      screen.getByRole("button", { name: "„Gibt es ein Team?“ nach unten" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.editor.conflict,
    );

    navigation.params = new URLSearchParams(
      "questionnaireDeleteField=f-has_team",
    );
    cleanup();
    renderEditor(fake);
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    await waitFor(() =>
      expect(fake.deleteField).toHaveBeenCalledWith("f-has_team", {
        expectedBlockVersion: 3,
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.QUESTIONNAIRE_INVALID_CONDITION,
    );
  });

  it("shows another editor's head changes after a conflict and keeps own input", async () => {
    const current = {
      ...block(),
      version: 9,
      key: "team_renamed",
      translations: { de: { title: "Team neu", intro: null } },
    };
    renderEditor(
      api({
        moveField: vi.fn().mockResolvedValue({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          current,
        }),
      }),
    );
    expect(screen.getByDisplayValue("Unternehmen")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("company_profile"), {
      target: { value: "own_key" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "„Gibt es ein Team?“ nach unten" }),
    );

    expect(await screen.findByDisplayValue("Team neu")).toBeInTheDocument();
    expect(screen.getByDisplayValue("own_key")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("team_renamed")).not.toBeInTheDocument();
  });

  it("opens the add dialog through the URL", () => {
    renderEditor(api());
    fireEvent.click(screen.getByRole("button", { name: "Feld hinzufügen" }));
    expect(navigation.replace).toHaveBeenCalledWith(
      "/de/crm/questionnaire-templates/blocks/b-1?questionnaireField=new",
      { scroll: false },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Unterfeld zu „Teammitglieder“ hinzufügen",
      }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/de/crm/questionnaire-templates/blocks/b-1?questionnaireField=new&questionnaireParent=f-members",
      { scroll: false },
    );
  });

  it("renders no write action without write access", () => {
    renderEditor(api(), false);
    expect(
      screen.queryByRole("button", { name: "Feld hinzufügen" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nach unten/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Änderungen speichern" }),
    ).not.toBeInTheDocument();
  });

  it("explains an empty block", () => {
    renderEditor(api(), true, blockFixture([]));
    expect(
      screen.getByText(content.editor.fields.empty.title),
    ).toBeInTheDocument();
  });
});

describe("owner-neutral editor", () => {
  it("imports nothing from the catalog, so a form's block can reuse it unchanged", () => {
    const root = join(
      process.cwd(),
      "src/components/workspace/crm/questionnaire/editor",
    );
    const files = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
      .filter((entry) => !entry.name.endsWith(".test.tsx"))
      .map((entry) => join(entry.parentPath, entry.name));

    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // Catalog components and the catalog writes stay outside; shared constants are fine.
      expect(source, file).not.toMatch(/from "[^"]*\/catalog\/[^"]*"/);
      expect(source, file).not.toMatch(/from "@\/client\//);
    }
  });
});
