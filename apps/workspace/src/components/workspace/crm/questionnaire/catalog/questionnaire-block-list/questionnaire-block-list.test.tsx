// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireBlockList } from "./questionnaire-block-list";

const content = getCrmQuestionnaireDictionary("de");
const text = content.catalog.blocks;

function renderList(
  list: Parameters<typeof QuestionnaireBlockList>[0]["list"],
  createHref:
    string | null = "/de/crm/questionnaire-templates?mode=create-block",
) {
  render(
    <QuestionnaireBlockList
      blockHref={(id) => `/de/crm/questionnaire-templates/blocks/${id}`}
      content={content}
      createHref={createHref}
      list={list}
      locale="de"
      resetHref="/de/crm/questionnaire-templates"
    />,
  );
}

describe("QuestionnaireBlockList", () => {
  afterEach(cleanup);

  it("tells an empty catalog from a filter without matches", () => {
    renderList({ hasBlocks: false, rows: [] });
    expect(screen.getByText(text.empty.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: text.empty.action }),
    ).toHaveAttribute(
      "href",
      "/de/crm/questionnaire-templates?mode=create-block",
    );
    cleanup();

    renderList({ hasBlocks: true, rows: [] });
    expect(screen.getByText(text.noResults.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: text.noResults.action }),
    ).toHaveAttribute("href", "/de/crm/questionnaire-templates");
  });

  it("offers no create action without write access", () => {
    renderList({ hasBlocks: false, rows: [] }, null);
    expect(
      screen.queryByRole("link", { name: text.empty.action }),
    ).not.toBeInTheDocument();
  });

  it("shows the company-wide flag and the missing languages of a block", () => {
    renderList({
      hasBlocks: true,
      rows: [
        {
          id: "b-1",
          key: "company_profile",
          titles: { de: "Unternehmen" },
          carryOver: true,
          status: QuestionnaireCatalogStatus.Active,
          fieldCount: 12,
          missingLocales: ["en"],
          templateCount: 2,
        },
      ],
    });
    expect(screen.getByRole("link", { name: "Unternehmen" })).toHaveAttribute(
      "href",
      "/de/crm/questionnaire-templates/blocks/b-1",
    );
    expect(screen.getByText(text.carryOver)).toBeInTheDocument();
    expect(screen.getByText("Fehlt: Englisch")).toBeInTheDocument();
    expect(screen.getByText("12 Felder")).toBeInTheDocument();
  });
});
