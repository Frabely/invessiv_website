// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireTemplateEditor } from "./questionnaire-template-editor";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn((href: string) => {
    navigation.params = new URLSearchParams(href.split("?")[1] ?? "");
  }),
  refresh: vi.fn(),
}));
const api = vi.hoisted(() => ({ getBlock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/crm/questionnaire-templates/templates/template-1",
  useRouter: () => ({
    replace: navigation.replace,
    refresh: navigation.refresh,
  }),
  useSearchParams: () => navigation.params,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/client/crm/questionnaire-catalog-api-service", () => ({
  questionnaireCatalogApiService: {
    getBlock: api.getBlock,
    definitionApi: {},
    updateTemplate: vi.fn(),
  },
}));
vi.mock(
  "../../editor/questionnaire-block-editor/questionnaire-block-editor",
  () => ({
    QuestionnaireBlockEditor: ({
      block,
      canWrite,
      onBlockChangeAction,
    }: {
      block: QuestionnaireBlockDto;
      canWrite: boolean;
      onBlockChangeAction: (block: QuestionnaireBlockDto) => void;
    }) => (
      <div>
        <p>Block editor</p>
        {canWrite ? (
          <button
            onClick={() =>
              onBlockChangeAction({
                ...block,
                translations: { en: { title: "Updated block", intro: null } },
                version: block.version + 1,
              })
            }
          >
            Update block
          </button>
        ) : null}
      </div>
    ),
  }),
);
vi.mock(
  "../../block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog",
  () => ({
    QuestionnaireBlockPickerDialog: ({
      blocks,
      chosenIds,
      onAddAction,
      onCloseAction,
    }: {
      blocks: QuestionnaireBlockSummaryDto[];
      chosenIds: string[];
      onAddAction: (blocks: QuestionnaireBlockSummaryDto[]) => boolean;
      onCloseAction: () => void;
    }) => (
      <div role="dialog" aria-label="Picker">
        <button
          onClick={() => {
            onAddAction(
              blocks
                .filter((block) => !chosenIds.includes(block.id))
                .slice(0, 1),
            );
            onCloseAction();
          }}
        >
          Choose block
        </button>
      </div>
    ),
  }),
);

function block(id: string): QuestionnaireBlockDto {
  return {
    id,
    key: id,
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: { en: { title: id, intro: null } },
    fields: [],
    version: 1,
  };
}

function summary(id: string): QuestionnaireBlockSummaryDto {
  return {
    id,
    key: id,
    titles: { en: id },
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    fieldCount: 0,
    missingLocales: [],
    templateCount: 1,
  };
}

function template(ids: string[]): QuestionnaireTemplateDto {
  return {
    id: "template-1",
    title: "Test template",
    description: null,
    status: QuestionnaireCatalogStatus.Active,
    blocks: ids.map((blockId, position) => ({ blockId, position })),
    version: 1,
  };
}

function editor(ids: string[], canWrite = true) {
  return (
    <QuestionnaireTemplateEditor
      backHref="/en/crm/questionnaire-templates"
      blocks={[summary("a"), summary("b")]}
      initialBlocks={ids.map(block)}
      canWrite={canWrite}
      content={getCrmQuestionnaireDictionary("en")}
      fixedChoiceLabels={{
        de: { yes: "Ja", no: "Nein" },
        en: { yes: "Yes", no: "No" },
      }}
      locale="en"
      template={template(ids)}
    />
  );
}

describe("QuestionnaireTemplateEditor preview and block dialog", () => {
  beforeEach(() => {
    navigation.params = new URLSearchParams();
    navigation.replace.mockClear();
    api.getBlock.mockReset();
  });
  afterEach(cleanup);

  it("follows the unsaved order and retains it while the URL dialog opens and closes", async () => {
    const view = render(editor(["a", "b"]));
    const preview = screen
      .getByRole("heading", { name: "Preview" })
      .closest("section")!;
    expect(
      within(preview)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(["Preview", "a", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "Move “a” down" }));
    expect(
      within(preview)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(["Preview", "b", "a"]);
    const link = screen.getAllByRole("link", { name: "Open block" })[0];
    navigation.params = new URLSearchParams(
      new URL(link.getAttribute("href")!, "https://example.test").search,
    );
    view.rerender(editor(["a", "b"]));
    expect(screen.getByText("Block editor")).toBeVisible();
    expect(screen.getByText("Unsaved changes")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Update block" }));
    expect(
      within(preview).getByRole("heading", { name: "Updated block" }),
    ).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(navigation.replace).toHaveBeenCalledWith(
      "/en/crm/questionnaire-templates/templates/template-1",
      { scroll: false },
    );
    view.rerender(editor(["a", "b"]));
    await waitFor(() =>
      expect(screen.queryByText("Block editor")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(link).toHaveFocus());
    expect(
      within(preview)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(["Preview", "Updated block", "a"]);
  });

  it("loads a newly added block and removes it from the preview immediately", async () => {
    api.getBlock.mockResolvedValue(block("b"));
    render(editor(["a"]));
    fireEvent.click(screen.getByRole("button", { name: "Add block" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose block" }));
    const preview = screen
      .getByRole("heading", { name: "Preview" })
      .closest("section")!;
    expect(
      await within(preview).findByRole("heading", { name: "b" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove “b”" }));
    expect(
      within(preview).queryByRole("heading", { name: "b" }),
    ).not.toBeInTheDocument();
  });

  it("opens only selected blocks and hides write actions for readers", () => {
    navigation.params = new URLSearchParams("questionnaireBlock=unknown");
    const view = render(editor(["a"], false));
    expect(screen.queryByText("Block editor")).not.toBeInTheDocument();
    navigation.params = new URLSearchParams("questionnaireBlock=a");
    view.rerender(editor(["a"], false));
    expect(screen.getByText("Block editor")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Update block" }),
    ).not.toBeInTheDocument();
  });

  it("scrolls to a block in the preview without opening its editor", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    render(editor(["a", "b"]));
    fireEvent.click(screen.getByRole("button", { name: "b" }));
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(screen.queryByText("Block editor")).not.toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("scrolls only the right preview pane on desktop", () => {
    const view = render(editor(["a", "b"]));
    const scroll = view.container.querySelector<HTMLDivElement>(
      "[data-preview-scroll]",
    )!;
    const target = scroll.querySelector<HTMLElement>('[data-block-id="b"]')!;
    const original = window.getComputedStyle.bind(window);
    const computed = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) =>
        element === scroll
          ? ({ overflowY: "auto" } as CSSStyleDeclaration)
          : original(element),
      );
    scroll.scrollTo = vi.fn();
    vi.spyOn(scroll, "getBoundingClientRect").mockReturnValue({
      top: 100,
    } as DOMRect);
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      top: 320,
    } as DOMRect);
    fireEvent.click(screen.getByRole("button", { name: "b" }));
    expect(scroll.scrollTo).toHaveBeenCalledWith({
      top: 204,
      behavior: "smooth",
    });
    computed.mockRestore();
  });
});
