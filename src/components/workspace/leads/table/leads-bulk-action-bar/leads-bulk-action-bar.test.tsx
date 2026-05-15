// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import {
  getLeadsBulkDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";

import { useLeadsTableSelection } from "../leads-table-selection-provider/leads-table-selection-context";
import { LeadsTableSelectionProvider } from "../leads-table-selection-provider/leads-table-selection-provider";
import { LeadsBulkActionBar } from "./leads-bulk-action-bar";

const dialogMocks = vi.hoisted(() => ({
  archiveDialog: vi.fn(),
  deleteDialog: vi.fn(),
  editDialog: vi.fn(),
}));

vi.mock("../leads-bulk-edit-dialog/leads-bulk-edit-dialog", () => ({
  LeadsBulkEditDialog: () => {
    dialogMocks.editDialog();
    return <div data-testid="bulk-edit-dialog" />;
  },
}));

vi.mock(
  "../leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog",
  () => ({
    LeadsBulkArchiveConfirmDialog: () => {
      dialogMocks.archiveDialog();
      return <div data-testid="bulk-archive-dialog" />;
    },
  }),
);

vi.mock(
  "../leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog",
  () => ({
    LeadsBulkDeleteConfirmDialog: () => {
      dialogMocks.deleteDialog();
      return <div data-testid="bulk-delete-dialog" />;
    },
  }),
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createLead(index: number): LeadSummaryDto {
  return {
    id: `lead-${index}`,
    displayName: `Lead ${index}`,
    firstName: `Lead`,
    lastName: String(index),
    companyName: `Company ${index}`,
    email: `lead-${index}@example.com`,
    phone: null,
    websiteUrl: null,
    score: 42,
    source: "manual",
    leadStatus: "new",
    owner: null,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-02T10:00:00.000Z",
    category: null,
    socialProfiles: [],
  };
}

function SelectionDriver({ leadId }: { leadId: string }) {
  const { toggleRow } = useLeadsTableSelection();

  return (
    <button onClick={() => toggleRow(leadId)} type="button">
      select-lead
    </button>
  );
}

describe("LeadsBulkActionBar", () => {
  it("shows the selection summary and opens the archive dialog", () => {
    const rows = [createLead(1), createLead(2)];
    const bulkContent = getLeadsBulkDictionary("en");
    const sharedContent = getLeadsSharedDictionary("en");

    render(
      <LeadsTableSelectionProvider rowIds={rows.map((row) => row.id)}>
        <SelectionDriver leadId={rows[0].id} />
        <LeadsBulkActionBar
          bulkContent={bulkContent}
          categories={[]}
          rows={rows}
          sharedContent={sharedContent}
        />
      </LeadsTableSelectionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "select-lead" }));

    expect(
      screen.getByText(bulkContent.summary.selectedOne),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: bulkContent.toolbar.edit }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: bulkContent.toolbar.archive }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: bulkContent.toolbar.delete }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: bulkContent.toolbar.archive }),
    );

    expect(screen.getByTestId("bulk-archive-dialog")).toBeInTheDocument();
    expect(dialogMocks.archiveDialog).toHaveBeenCalled();
  });
});
