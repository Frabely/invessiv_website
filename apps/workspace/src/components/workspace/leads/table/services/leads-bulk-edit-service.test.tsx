// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LeadSummaryDto } from "@invessiv/common/contracts/leads";
import type { LeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";
import { getLeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";
import { leadsBulkEditService } from "@/components/workspace/leads/table/services/leads-bulk-edit-service";
import { LeadsBulkArchiveConfirmDialog } from "@/components/workspace/leads/table/bulk/leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog";
import { LeadsBulkDeleteConfirmDialog } from "@/components/workspace/leads/table/bulk/leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog";
import { BulkSubmitFailureKind } from "@invessiv/common/constants/leads/bulk/bulk-submit-failure-kinds";

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

type BulkConfirmDialogScenario = {
  component: ComponentType<BulkConfirmDialogProps>;
  confirmLabel: string;
  serviceMethod: "archive" | "delete";
  title: string;
};

type BulkConfirmDialogProps = {
  bulkContent: LeadsBulkDictionary;
  onCloseAction: () => void;
  onSuccessAction: () => void;
  selectedLeads: LeadSummaryDto[];
};

function renderBulkConfirmDialog(
  ScenarioComponent: BulkConfirmDialogScenario["component"],
  bulkContent: LeadsBulkDictionary,
  selectedLeads: LeadSummaryDto[],
  onCloseAction: () => void,
  onSuccessAction: () => void,
) {
  render(
    <ScenarioComponent
      bulkContent={bulkContent}
      onCloseAction={onCloseAction}
      onSuccessAction={onSuccessAction}
      selectedLeads={selectedLeads}
    />,
  );
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

const bulkConfirmDialogScenarios = [
  {
    component: LeadsBulkArchiveConfirmDialog,
    confirmLabel: "archiveConfirm",
    serviceMethod: "archive",
    title: "archiveConfirm",
  },
  {
    component: LeadsBulkDeleteConfirmDialog,
    confirmLabel: "deleteConfirm",
    serviceMethod: "delete",
    title: "deleteConfirm",
  },
] as const;

describe.each(bulkConfirmDialogScenarios)(
  "$serviceMethod confirm dialog",
  ({ component, confirmLabel, serviceMethod, title }) => {
    it("renders the full selected list and submits the bulk action", async () => {
      const submitSpy = vi
        .spyOn(leadsBulkEditService, serviceMethod)
        .mockResolvedValue({ ok: true });
      const bulkContent = getLeadsBulkDictionary("en");
      const selectedLeads = Array.from({ length: 12 }, (_, index) =>
        createLead(index + 1),
      );
      const onCloseAction = vi.fn();
      const onSuccessAction = vi.fn();

      renderBulkConfirmDialog(
        component,
        bulkContent,
        selectedLeads,
        onCloseAction,
        onSuccessAction,
      );

      expect(
        screen.getByRole("dialog", {
          name: bulkContent[title].title,
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(12);
      expect(screen.queryByText("and 2 more")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: bulkContent[confirmLabel].confirm,
        }),
      );

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith({
          ids: selectedLeads.map((lead) => lead.id),
        });
      });
      expect(routerRefreshMock).toHaveBeenCalled();
      expect(onSuccessAction).toHaveBeenCalled();
      expect(onCloseAction).not.toHaveBeenCalled();
    });
  },
);
