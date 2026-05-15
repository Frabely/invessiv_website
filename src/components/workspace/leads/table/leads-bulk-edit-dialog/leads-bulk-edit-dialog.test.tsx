// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { BulkSkipReason } from "@/common/constants/leads/bulk/bulk-skip-reasons";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import {
  getLeadsBulkDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";

import { leadsBulkEditService } from "../services/leads-bulk-edit-service";
import { LeadsBulkEditDialog } from "./leads-bulk-edit-dialog";

const routerRefreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("LeadsBulkEditDialog", () => {
  it("submits a selected field and closes on success", async () => {
    const editSpy = vi.spyOn(leadsBulkEditService, "edit").mockResolvedValue({
      failedLeads: [],
      ok: true,
      updatedCount: 2,
    });
    const bulkContent = getLeadsBulkDictionary("en");
    const sharedContent = getLeadsSharedDictionary("en");
    const categories: LeadCategoryOption[] = [
      { id: "cat-1", label: "Category 1", labelKey: "category.one" },
    ];
    const onCloseAction = vi.fn();
    const onSuccessAction = vi.fn();

    render(
      <LeadsBulkEditDialog
        bulkContent={bulkContent}
        categories={categories}
        onCloseAction={onCloseAction}
        onSuccessAction={onSuccessAction}
        selectedIds={["lead-1", "lead-2"]}
        sharedContent={sharedContent}
      />,
    );

    expect(
      screen.getByRole("dialog", {
        name: bulkContent.editDialog.title.replace("{count}", "2"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: bulkContent.editDialog.save.replace("{count}", "2"),
      }),
    ).toBeDisabled();

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(
      screen.getByRole("button", {
        name: bulkContent.editDialog.save.replace("{count}", "2"),
      }),
    );

    await waitFor(() => {
      expect(editSpy).toHaveBeenCalledWith({
        ids: ["lead-1", "lead-2"],
        patch: { status: ContactLeadStatus.New },
      });
    });
    expect(routerRefreshMock).toHaveBeenCalled();
    expect(onSuccessAction).toHaveBeenCalled();
    expect(onCloseAction).not.toHaveBeenCalled();
  });

  it("shows a partial-success close state when the service returns skipped leads", async () => {
    vi.spyOn(leadsBulkEditService, "edit").mockResolvedValue({
      failedLeads: [
        {
          displayName: "Lead 2",
          id: "lead-2",
          reason: BulkSkipReason.NotesTooLong,
        },
      ],
      ok: true,
      updatedCount: 1,
    });
    const bulkContent = getLeadsBulkDictionary("en");
    const sharedContent = getLeadsSharedDictionary("en");

    render(
      <LeadsBulkEditDialog
        bulkContent={bulkContent}
        categories={[]}
        onCloseAction={vi.fn()}
        onSuccessAction={vi.fn()}
        selectedIds={["lead-1", "lead-2"]}
        sharedContent={sharedContent}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(
      screen.getByRole("button", {
        name: bulkContent.editDialog.save.replace("{count}", "2"),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          bulkContent.editDialog.result.successBanner
            .replace("{updated}", "1")
            .replace("{total}", "2"),
        ),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", {
        name: bulkContent.editDialog.result.skippedHeader,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: bulkContent.editDialog.result.close,
      }),
    ).toHaveLength(2);
  });
});
