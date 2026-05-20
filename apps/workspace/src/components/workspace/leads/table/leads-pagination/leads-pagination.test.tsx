// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLeadsPaginationDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadsPagination } from "./leads-pagination";
import {
  buildPaginationHref,
  getPaginationItems,
} from "./leads-pagination.utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("LeadsPagination", () => {
  it("renders a disabled pagination shell for empty result sets", () => {
    render(
      <LeadsPagination
        basePath="/de/leads"
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
        basePath="/de/leads"
        content={getLeadsPaginationDictionary("de")}
        currentPage={2}
        perPage={20}
        queryString="sort=created_desc"
        total={40}
      />,
    );

    expect(screen.getByText("Zeige 21–40 von 40")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seite 1" })).toBeInTheDocument();
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
  });
});

describe("leads pagination utilities", () => {
  it("builds hrefs by preserving the existing query string", () => {
    expect(buildPaginationHref("/de/leads", "sort=created_desc", 3)).toBe(
      "/de/leads?sort=created_desc&page=3",
    );
  });

  it("builds hrefs without a query string when none exists", () => {
    expect(buildPaginationHref("/de/leads", "", 1)).toBe("/de/leads?page=1");
  });

  it("returns no items for an empty page set", () => {
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it("returns a compact window for large page sets", () => {
    expect(getPaginationItems(4, 10)).toEqual([
      { kind: "page", page: 1 },
      { kind: "ellipsis", id: "ellipsis-1-3" },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
      { kind: "page", page: 5 },
      { kind: "ellipsis", id: "ellipsis-5-10" },
      { kind: "page", page: 10 },
    ]);
  });

  it("keeps the first window compact near the start", () => {
    expect(getPaginationItems(2, 12)).toEqual([
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "ellipsis", id: "ellipsis-3-12" },
      { kind: "page", page: 12 },
    ]);
  });

  it("keeps the last window compact near the end", () => {
    expect(getPaginationItems(11, 12)).toEqual([
      { kind: "page", page: 1 },
      { kind: "ellipsis", id: "ellipsis-1-10" },
      { kind: "page", page: 10 },
      { kind: "page", page: 11 },
      { kind: "page", page: 12 },
    ]);
  });

  it("returns all pages when the set is small", () => {
    expect(getPaginationItems(2, 4)).toEqual([
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
    ]);
  });
});
