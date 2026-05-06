// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  getLeadsSharedDictionary,
  getLeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsTable } from "./leads-table";

afterEach(() => {
  cleanup();
});

describe("LeadsTable", () => {
  it("keeps the empty state inside the table body", () => {
    render(
      <LeadsTable
        basePath="/de/workspace/leads"
        emptyState={{
          actionLabel: "Filter zurücksetzen",
          description: "Keine Leads gefunden.",
          title: "Keine Treffer",
          variant: "filtered",
        }}
        locale="de"
        queryString="search=abc"
        rows={[]}
        sharedContent={getLeadsSharedDictionary("de")}
        tableContent={getLeadsTableDictionary("de")}
      />,
    );

    expect(screen.getByText("Keine Treffer")).toBeInTheDocument();
    expect(
      screen.getByText("Keine Leads gefunden.").closest("tr"),
    ).toBeTruthy();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
