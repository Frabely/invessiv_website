// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";
import { LeadsEmptyStateVariant } from "@invessiv/common/constants/leads/list/lead-empty-state-variants";
import {
  getLeadsBulkDictionary,
  getLeadsDeleteDictionary,
  getLeadsOutreachDictionary,
  getLeadsSharedDictionary,
  getLeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsTable } from "./leads-table";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

afterEach(() => {
  cleanup();
});

describe("LeadsTable", () => {
  it("keeps the empty state inside the table body", () => {
    render(
      <LeadsTable
        basePath="/de/leads"
        bulkContent={getLeadsBulkDictionary("de")}
        categories={[]}
        deleteContent={getLeadsDeleteDictionary("de")}
        emptyState={{
          actionLabel: "Filter zurücksetzen",
          description: "Keine Leads gefunden.",
          title: "Keine Treffer",
          variant: LeadsEmptyStateVariant.Filtered,
        }}
        locale="de"
        outreachContent={getLeadsOutreachDictionary("de")}
        queryString="search=abc"
        currentSearchParams={{ search: "abc" }}
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

  it("renders lead badges in the table rows", () => {
    const rows: LeadSummaryDto[] = [
      {
        id: "lead-1",
        displayName: "Anna Meyer",
        firstName: "Anna",
        lastName: "Meyer",
        companyName: "Acme",
        email: "anna@example.com",
        phone: null,
        websiteUrl: null,
        score: 82,
        source: "manual",
        leadStatus: "qualified",
        owner: null,
        createdAt: "2026-05-01T10:00:00.000Z",
        updatedAt: "2026-05-02T10:00:00.000Z",
        category: {
          id: "cat-1",
          slug: "coaches",
          labelKey: "coaches",
        },
        socialProfiles: [],
      },
    ];

    render(
      <LeadsTable
        basePath="/de/leads"
        bulkContent={getLeadsBulkDictionary("de")}
        categories={[]}
        deleteContent={getLeadsDeleteDictionary("de")}
        locale="de"
        outreachContent={getLeadsOutreachDictionary("de")}
        queryString=""
        currentSearchParams={{}}
        rows={rows}
        sharedContent={getLeadsSharedDictionary("de")}
        tableContent={getLeadsTableDictionary("de")}
      />,
    );

    expect(screen.getByText("Qualifiziert")).toBeInTheDocument();
    expect(
      screen.getByText("Qualifiziert").closest("[data-kind='status']"),
    ).toBeTruthy();
    expect(screen.getByText("Manuell")).toBeInTheDocument();
    expect(
      screen.getByText("Manuell").closest("[data-kind='source']"),
    ).toBeTruthy();
    expect(screen.getByText("Coaches")).toBeInTheDocument();
    expect(
      screen.getByText("Coaches").closest("[data-kind='category']"),
    ).toBeTruthy();
    expect(
      screen.getByText("Coaches").closest("[data-category-key='coaches']"),
    ).toBeTruthy();
  });
});
