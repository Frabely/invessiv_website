// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFilesView } from "./portal-files-view";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: { value: "" },
  listFiles: vi.fn(),
  getDownloadUrl: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/portal/customer-1/files",
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.search.value),
}));
vi.mock("@/client/portal/portal-files-api-service", () => ({
  portalFilesApiService: {
    listFiles: mocks.listFiles,
    getDownloadUrl: mocks.getDownloadUrl,
    readText: vi.fn(),
    downloadArchive: vi.fn(),
    createUpload: vi.fn(),
    completeUpload: vi.fn(),
    createLink: vi.fn(),
  },
}));

const content = getPortalFilesDictionary("en");

function file(overrides: Partial<PortalFileDto> = {}): PortalFileDto {
  return {
    id: "file-1",
    projectId: "project-1",
    projectTitle: "Relaunch",
    source: FileSource.Upload,
    assetKind: AssetKind.Document,
    displayName: "Offer.pdf",
    note: "Final version",
    origin: PortalFileOrigin.FromUs,
    extension: UploadExtension.Pdf,
    sizeBytes: 2_000,
    url: null,
    createdAt: "2026-09-25T10:00:00.000Z",
    ...overrides,
  };
}

function page(files: PortalFileDto[]) {
  return { files, total: files.length, page: 1, pageSize: 25 };
}

function renderView(
  props: Partial<Parameters<typeof PortalFilesView>[0]> = {},
) {
  return render(
    <PortalFilesView
      canUpload
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      initialPage={page([file()])}
      initialTab={PortalFileOrigin.FromUs}
      locale="en"
      projects={[]}
      {...props}
    />,
  );
}

describe("PortalFilesView", () => {
  beforeEach(() => {
    mocks.search.value = "";
    mocks.listFiles.mockResolvedValue({ ok: true, value: page([]) });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the server-rendered released files without reloading them", () => {
    renderView();

    expect(
      screen.getByRole("heading", { level: 1, name: content.page.heading }),
    ).toBeInTheDocument();
    const list = screen.getByRole("list", { name: content.list.label });
    expect(within(list).getByText("Offer.pdf")).toBeInTheDocument();
    expect(within(list).getByText("Final version")).toBeInTheDocument();
    expect(within(list).getByText("Relaunch")).toBeInTheDocument();
    expect(mocks.listFiles).not.toHaveBeenCalled();
  });

  it("offers upload and link only to contacts who may upload", () => {
    const { unmount } = renderView();
    expect(screen.getByText(content.intake.dropLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.actions.addLink }),
    ).toBeInTheDocument();
    unmount();

    renderView({ canUpload: false });
    expect(screen.queryByText(content.intake.dropLabel)).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.actions.addLink }),
    ).toBeNull();
  });

  it("shows the owner notice with a CRM link instead of the upload", () => {
    renderView({ canUpload: false, cockpitHref: "/en/crm?cockpit=customer-1" });

    expect(screen.getByText(content.owner.hint)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.owner.link }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });

  it("keeps the tab in the URL without a server navigation", () => {
    window.history.replaceState(null, "", "/en/portal/customer-1/files");
    renderView();

    fireEvent.click(screen.getByRole("tab", { name: content.tabs.fromYou }));

    expect(window.location.pathname + window.location.search).toBe(
      "/en/portal/customer-1/files?tab=fromYou",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("explains the empty tabs by their purpose", async () => {
    mocks.search.value = "tab=fromYou";
    renderView({ initialPage: page([]) });

    expect(
      await screen.findByText(content.empty.fromYou.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.empty.fromYou.description),
    ).toBeInTheDocument();
    expect(mocks.listFiles).toHaveBeenCalledWith(
      "customer-1",
      PortalFileOrigin.FromYou,
      1,
    );
  });

  it("hides the previous tab's files while the next tab loads or fails", async () => {
    let rejectNext: () => void = () => undefined;
    mocks.listFiles.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          rejectNext = () => resolve({ ok: false, code: "FILE_NOT_FOUND" });
        }),
    );
    const view = renderView();
    expect(screen.getByText("Offer.pdf")).toBeInTheDocument();

    mocks.search.value = "tab=fromYou";
    view.rerender(
      <PortalFilesView
        canUpload
        cockpitHref={null}
        content={content}
        customerId="customer-1"
        initialPage={page([file()])}
        initialTab={PortalFileOrigin.FromUs}
        locale="en"
        projects={[]}
      />,
    );
    expect(screen.queryByText("Offer.pdf")).toBeNull();
    expect(screen.getByText(content.list.loading)).toBeInTheDocument();

    rejectNext();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.list.loadError,
    );
    expect(screen.queryByText("Offer.pdf")).toBeNull();
  });

  it("opens links in a new tab and offers no download for them", () => {
    renderView({
      initialPage: page([
        file({
          id: "link-1",
          source: FileSource.Link,
          assetKind: AssetKind.Link,
          displayName: "Brand film",
          extension: null,
          sizeBytes: null,
          url: "https://drive.google.com/file/1",
        }),
      ]),
    });

    const links = screen.getAllByRole("link", { name: /Brand film/ });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "https://drive.google.com/file/1");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getByText("drive.google.com")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download Brand film" }),
    ).toBeNull();
  });

  it("shows a translated error when a download is refused", async () => {
    mocks.getDownloadUrl.mockResolvedValue({
      ok: false,
      code: "FILE_NOT_FOUND",
    });
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Download Offer.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.FILE_NOT_FOUND,
    );
  });

  it("never offers videos for the ZIP", () => {
    renderView({
      initialPage: page([
        file(),
        file({
          id: "video-1",
          assetKind: AssetKind.Video,
          displayName: "clip.mp4",
          extension: UploadExtension.Mp4,
        }),
      ]),
    });

    expect(
      screen.getByRole("checkbox", { name: "Select Offer.pdf for the ZIP" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Select clip.mp4 for the ZIP" }),
    ).toBeNull();
    expect(screen.getByText(content.archive.videoHint)).toBeInTheDocument();
  });
});
