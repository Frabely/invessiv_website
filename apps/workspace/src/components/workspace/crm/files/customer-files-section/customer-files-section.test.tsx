// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import { getCrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerFilesSection } from "./customer-files-section";

const mocks = vi.hoisted(() => ({
  listFiles: vi.fn(),
  getDownloadUrl: vi.fn(),
  refresh: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/crm",
  useRouter: () => ({ refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    listFiles: mocks.listFiles,
    getDownloadUrl: mocks.getDownloadUrl,
    readText: vi.fn(),
  },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const content = getCrmFilesDictionary("de");

function fileDto(overrides: Partial<FileDto> = {}): FileDto {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    customerId: CUSTOMER_ID,
    projectId: null,
    source: FileSource.Upload,
    status: FileStatus.Ready,
    assetKind: AssetKind.Document,
    displayName: "Vertrag.pdf",
    note: "Unterschrieben",
    visibleToCustomer: false,
    uploadedBySide: UploadSide.Internal,
    uploadedByMemberId: "m1",
    uploadedByPortalMembershipId: null,
    contentType: "application/pdf",
    extension: "pdf",
    sizeBytes: 1_500_000,
    inspectionStatus: FileInspectionStatus.Unscanned,
    url: null,
    version: 1,
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-09-20T10:00:00.000Z",
    ...overrides,
  };
}

function viewModel(overrides: Partial<FilesViewModel> = {}): FilesViewModel {
  const all = { customerWide: true, projectIds: [PROJECT_ID] };
  return {
    projects: [{ id: PROJECT_ID, title: "Website" }],
    read: all,
    write: all,
    remove: all,
    members: [{ id: "m1", displayName: "Mara Team" }],
    ...overrides,
  };
}

function renderSection(
  model: FilesViewModel = viewModel(),
  projectId?: string,
) {
  return render(
    <CustomerFilesSection
      content={content}
      customerId={CUSTOMER_ID}
      locale="de"
      onChangedAction={vi.fn()}
      projectId={projectId}
      revision={0}
      viewModel={model}
    />,
  );
}

beforeEach(() => {
  mocks.search = "";
  mocks.listFiles.mockResolvedValue({
    ok: true,
    value: {
      files: [
        fileDto(),
        fileDto({
          id: "55555555-5555-4555-8555-555555555555",
          projectId: PROJECT_ID,
          source: FileSource.Link,
          assetKind: AssetKind.Link,
          displayName: "Imagefilm",
          note: null,
          url: "https://www.drive.google.com/file/1",
          extension: null,
          contentType: null,
          sizeBytes: null,
          inspectionStatus: null,
          visibleToCustomer: true,
          uploadedBySide: UploadSide.Customer,
          uploadedByMemberId: null,
          uploadedByPortalMembershipId: "pm1",
        }),
      ],
      total: 2,
      page: 1,
      pageSize: 25,
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("CustomerFilesSection", () => {
  it("lists files and links with visibility in text, uploader and project", async () => {
    renderSection();
    const list = await screen.findByRole("list", {
      name: content.section.listLabel,
    });
    const [file, link] = within(list).getAllByRole("listitem");
    expect(within(file).getByText(content.visibility.hidden)).toBeVisible();
    expect(within(file).getByText("Mara Team")).toBeVisible();
    expect(within(file).getByText(content.row.customerWide)).toBeVisible();
    expect(within(file).getByText("Unterschrieben")).toBeVisible();
    expect(within(link).getByText(content.visibility.visible)).toBeVisible();
    expect(within(link).getByText(content.row.byCustomer)).toBeVisible();
    expect(within(link).getByText("drive.google.com")).toBeVisible();
    expect(within(link).getByText("Website")).toBeVisible();
    expect(
      within(link).getByRole("link", { name: /Imagefilm öffnen/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("2 Einträge")).toBeVisible();
  });

  it("offers write actions only for writable scopes and never as disabled buttons", async () => {
    renderSection(
      viewModel({
        write: { customerWide: false, projectIds: [PROJECT_ID] },
        remove: { customerWide: false, projectIds: [] },
      }),
    );
    const list = await screen.findByRole("list", {
      name: content.section.listLabel,
    });
    const [file, link] = within(list).getAllByRole("listitem");
    expect(
      within(file).queryByRole("button", { name: /bearbeiten/ }),
    ).toBeNull();
    expect(
      within(link).getByRole("button", { name: /bearbeiten/ }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /löschen/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: content.actions.upload }),
    ).toBeVisible();
  });

  it("hides every write entry point for a read-only actor", async () => {
    const none = { customerWide: false, projectIds: [] };
    renderSection(viewModel({ write: none, remove: none }));
    await screen.findByRole("list", { name: content.section.listLabel });
    expect(
      screen.queryByRole("button", { name: content.actions.upload }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.actions.addLink }),
    ).toBeNull();
  });

  it("keeps project, type and origin filters in the URL but never the search", async () => {
    window.history.replaceState(null, "", "/de/crm?customer=abc");
    renderSection();
    await screen.findByRole("list", { name: content.section.listLabel });
    fireEvent.click(screen.getByRole("button", { name: content.toolbar.kind }));
    fireEvent.click(
      screen.getByRole("option", { name: content.kinds[AssetKind.Image] }),
    );
    fireEvent.change(screen.getByLabelText(content.toolbar.search), {
      target: { value: "Vertrag" },
    });
    await waitFor(() =>
      expect(window.location.search).toBe("?customer=abc&filesKind=image"),
    );
    await waitFor(() =>
      expect(mocks.listFiles).toHaveBeenLastCalledWith(CUSTOMER_ID, {
        page: 1,
        pageSize: 25,
        assetKind: AssetKind.Image,
        search: "Vertrag",
      }),
    );
  });

  it("reads filters from the URL and ignores projects outside the readable set", async () => {
    mocks.search = `filesProject=${OTHER_PROJECT_ID}&filesOrigin=customer`;
    renderSection();
    await waitFor(() =>
      expect(mocks.listFiles).toHaveBeenCalledWith(CUSTOMER_ID, {
        page: 1,
        pageSize: 25,
        origin: "customer",
      }),
    );
  });

  it("pins a project section to its project without a project filter", async () => {
    renderSection(viewModel(), PROJECT_ID);
    await waitFor(() =>
      expect(mocks.listFiles).toHaveBeenCalledWith(CUSTOMER_ID, {
        page: 1,
        pageSize: 25,
        projectId: PROJECT_ID,
      }),
    );
    expect(screen.queryByLabelText(content.toolbar.project)).toBeNull();
  });

  it("explains an empty list differently for writers and filtered views", async () => {
    mocks.listFiles.mockResolvedValue({
      ok: true,
      value: { files: [], total: 0, page: 1, pageSize: 25 },
    });
    renderSection();
    expect(await screen.findByText(content.empty.title)).toBeVisible();
    expect(screen.getByText(content.empty.description)).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: content.toolbar.origin }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: content.origins.internal }),
    );
    expect(await screen.findByText(content.empty.filteredTitle)).toBeVisible();
  });

  it("shows a retry when the list cannot be loaded", async () => {
    mocks.listFiles.mockResolvedValueOnce({ ok: false, code: "FILE_INTERNAL" });
    renderSection();
    fireEvent.click(
      await screen.findByRole("button", { name: content.section.retry }),
    );
    expect(
      await screen.findByRole("list", { name: content.section.listLabel }),
    ).toBeVisible();
  });

  it("opens the preview for previewable files only", async () => {
    mocks.getDownloadUrl.mockResolvedValue({
      ok: true,
      value: "https://store/preview",
    });
    renderSection();
    fireEvent.click(
      await screen.findByRole("button", { name: /Vorschau von Vertrag\.pdf/ }),
    );
    expect(await screen.findByTitle("Vertrag.pdf")).toHaveAttribute(
      "src",
      "https://store/preview",
    );
    expect(mocks.getDownloadUrl).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      "inline",
    );
    expect(
      screen.queryByRole("button", { name: /Vorschau von Imagefilm/ }),
    ).toBeNull();
  });
});
