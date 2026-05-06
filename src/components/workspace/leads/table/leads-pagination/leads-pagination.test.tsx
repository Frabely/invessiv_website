// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getLeadsPaginationDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadsPagination } from "./leads-pagination";

afterEach(() => {
  cleanup();
});

describe("LeadsPagination", () => {
  it("renders a disabled pagination shell for empty result sets", () => {
    render(
      <LeadsPagination
        basePath="/de/workspace/leads"
        content={getLeadsPaginationDictionary("de")}
        currentPage={1}
        perPage={20}
        queryString="sort=created_desc"
        total={0}
      />,
    );

    expect(screen.getByText("Zeige 0–0 von 0")).toBeInTheDocument();
    expect(screen.getByText("1")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByText("Erste").closest('[aria-disabled="true"]'),
    ).toBeTruthy();
    expect(
      screen.getByText("Letzte").closest('[aria-disabled="true"]'),
    ).toBeTruthy();
  });

  it("keeps navigation active when results exist", () => {
    render(
      <LeadsPagination
        basePath="/de/workspace/leads"
        content={getLeadsPaginationDictionary("de")}
        currentPage={2}
        perPage={20}
        queryString="sort=created_desc"
        total={40}
      />,
    );

    expect(screen.getByText("Zeige 21–40 von 40")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seite 1" })).toHaveAttribute(
      "href",
      "/de/workspace/leads?sort=created_desc&page=1",
    );
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
  });
});
