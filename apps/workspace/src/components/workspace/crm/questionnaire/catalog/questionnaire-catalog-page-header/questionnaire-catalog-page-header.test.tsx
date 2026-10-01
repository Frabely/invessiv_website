// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import { QuestionnaireCatalogTab } from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import type { QuestionnaireCatalogFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-filters";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCatalogPageHeader } from "./questionnaire-catalog-page-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const content = getCrmQuestionnaireDictionary("de").catalog;

function header(search: string) {
  const filters: QuestionnaireCatalogFilters = {
    tab: QuestionnaireCatalogTab.Blocks,
    status: QuestionnaireCatalogStatusFilter.Active,
    search,
  };
  return (
    <QuestionnaireCatalogPageHeader
      basePath="/de/crm/questionnaire-templates"
      canWrite={false}
      content={content}
      filters={filters}
      panelId="panel"
      tabIds={{
        [QuestionnaireCatalogTab.Blocks]: "tab-blocks",
        [QuestionnaireCatalogTab.Templates]: "tab-templates",
      }}
    />
  );
}

describe("QuestionnaireCatalogPageHeader", () => {
  afterEach(cleanup);

  it("follows the search of the URL when the filters are reset elsewhere", () => {
    const view = render(header("foo"));
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("foo");

    view.rerender(header(""));

    expect(input).toHaveValue("");
  });

  it("keeps unsent typing while the URL stays the same", () => {
    const view = render(header(""));
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "logo" } });

    view.rerender(header(""));

    expect(input).toHaveValue("logo");
  });
});
