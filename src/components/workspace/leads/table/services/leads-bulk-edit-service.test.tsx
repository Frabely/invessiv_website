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

import type { LeadSummaryDto } from "@/common/contracts/leads";
import { getLeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";
import { leadsBulkEditService } from "@/components/workspace/leads/table/services/leads-bulk-edit-service";
import { LeadsBulkArchiveConfirmDialog } from "@/components/workspace/leads/table/leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog";
import { LeadsBulkDeleteConfirmDialog } from "@/components/workspace/leads/table/leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog";
import { BulkSubmitFailureKind } from "@/common/constants/leads/bulk/bulk-submit-failure-kinds";

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
  vi.unstubAllGlobals();
});

function createLead(index: number): LeadSummaryDto {
  return {
    id: `lead-${index}`,
    displayName: `Lead ${index}`,
    firstName: "Lead",
    lastName: String(index),
    companyName: `Company ${index}`,
    email: `lead-${index}@example.com`,
    phone: null,
    websiteUrl: null,
    score: index,
    source: "manual",
    leadStatus: "new",
    owner: null,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-02T10:00:00.000Z",
    category: null,
    socialProfiles: [],
  };
}

describe("leadsBulkEditService", () => {
  it("submits edit payloads to the bulk api and normalizes the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        failedLeads: [{ id: "lead-1", reason: "validation_error" }],
        updatedCount: 2,
      }),
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsBulkEditService.edit({
        ids: ["lead-1", "lead-2"],
        patch: {
          owner: null,
        },
      }),
    ).resolves.toEqual({
      failedLeads: [{ id: "lead-1", reason: "validation_error" }],
      ok: true,
      updatedCount: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/leads/bulk",
      expect.objectContaining({
        body: JSON.stringify({
          action: "bulk_edit",
          ids: ["lead-1", "lead-2"],
          patch: {
            owner: null,
          },
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it.each([
    ["archive", "archive"],
    ["delete", "delete"],
  ] as const)("submits %s ids to the bulk api", async (methodName, action) => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      leadsBulkEditService[methodName]({ ids: ["lead-1", "lead-2"] }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workspace/leads/bulk",
      expect.objectContaining({
        body: JSON.stringify({
          action,
          ids: ["lead-1", "lead-2"],
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it.each(["archive", "delete"] as const)(
    "maps non-ok responses for %s to server failures",
    async (methodName) => {
      const fetchMock = vi.fn().mockResolvedValue({
        status: 500,
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        leadsBulkEditService[methodName]({ ids: ["lead-1"] }),
      ).resolves.toEqual({
        kind: BulkSubmitFailureKind.Server,
        ok: false,
      });
    },
  );

  it.each(["archive", "delete", "edit"] as const)(
    "maps network errors for %s to network failures",
    async (methodName) => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
      vi.stubGlobal("fetch", fetchMock);

      if (methodName === "edit") {
        await expect(
          leadsBulkEditService.edit({
            ids: ["lead-1"],
            patch: {
              owner: null,
            },
          }),
        ).resolves.toEqual({
          kind: BulkSubmitFailureKind.Network,
          ok: false,
        });
        return;
      }

      await expect(
        leadsBulkEditService[methodName]({ ids: ["lead-1"] }),
      ).resolves.toEqual({
        kind: BulkSubmitFailureKind.Network,
        ok: false,
      });
    },
  );
});

describe("LeadsBulkArchiveConfirmDialog", () => {
  it("renders the full selected list and submits the archive action", async () => {
    const archiveSpy = vi
      .spyOn(leadsBulkEditService, "archive")
      .mockResolvedValue({ ok: true });
    const bulkContent = getLeadsBulkDictionary("en");
    const selectedLeads = Array.from({ length: 12 }, (_, index) =>
      createLead(index + 1),
    );
    const onCloseAction = vi.fn();
    const onSuccessAction = vi.fn();

    render(
      <LeadsBulkArchiveConfirmDialog
        bulkContent={bulkContent}
        onCloseAction={onCloseAction}
        onSuccessAction={onSuccessAction}
        selectedLeads={selectedLeads}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: bulkContent.archiveConfirm.title }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.queryByText("and 2 more")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: bulkContent.archiveConfirm.confirm }),
    );

    await waitFor(() => {
      expect(archiveSpy).toHaveBeenCalledWith({
        ids: selectedLeads.map((lead) => lead.id),
      });
    });
    expect(routerRefreshMock).toHaveBeenCalled();
    expect(onSuccessAction).toHaveBeenCalled();
    expect(onCloseAction).not.toHaveBeenCalled();
  });
});

describe("LeadsBulkDeleteConfirmDialog", () => {
  it("renders the full selected list and submits the delete action", async () => {
    const deleteSpy = vi
      .spyOn(leadsBulkEditService, "delete")
      .mockResolvedValue({ ok: true });
    const bulkContent = getLeadsBulkDictionary("en");
    const selectedLeads = Array.from({ length: 12 }, (_, index) =>
      createLead(index + 1),
    );
    const onCloseAction = vi.fn();
    const onSuccessAction = vi.fn();

    render(
      <LeadsBulkDeleteConfirmDialog
        bulkContent={bulkContent}
        onCloseAction={onCloseAction}
        onSuccessAction={onSuccessAction}
        selectedLeads={selectedLeads}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: bulkContent.deleteConfirm.title }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.queryByText("and 2 more")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: bulkContent.deleteConfirm.confirm }),
    );

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith({
        ids: selectedLeads.map((lead) => lead.id),
      });
    });
    expect(routerRefreshMock).toHaveBeenCalled();
    expect(onSuccessAction).toHaveBeenCalled();
    expect(onCloseAction).not.toHaveBeenCalled();
  });
});
