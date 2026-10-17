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
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFilesView } from "./portal-files-view";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  listFiles: vi.fn(),
  getDownloadUrl: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/portal/customer-1/files",
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
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
    uploadTransport: () => ({
      createTicket: vi.fn(),
      complete: vi.fn(),
      cancelPending: vi.fn(),
    }),
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

function stubWideScreen(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
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
      dashboardHref="/en/portal/customer-1"
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
    window.history.replaceState(null, "", "/en/portal/customer-1/files");
    mocks.listFiles.mockResolvedValue({ ok: true, value: page([]) });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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

  it("keeps the bar at the bottom like the other step pages", () => {
    const { container } = renderView();

    expect(
      container.querySelector("[data-portal-fixed-head]"),
    ).toBeInTheDocument();
  });

  it("offers one add action only to contacts who may upload", () => {
    const { unmount } = renderView();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeInTheDocument();
    expect(screen.queryByText(content.intake.dropLabel)).toBeNull();
    unmount();

    renderView({ canUpload: false });
    expect(screen.queryByText(content.intake.dropLabel)).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.actions.add }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.actions.addLink }),
    ).toBeNull();
  });

  it("shows ZIP actions before the add action while files are selected", () => {
    renderView();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Offer.pdf for the ZIP" }),
    );

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.archive.download }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeInTheDocument();

    const clear = screen.getByRole("button", { name: content.archive.clear });
    const download = screen.getByRole("button", {
      name: content.archive.download,
    });
    const add = screen.getByRole("button", { name: content.actions.add });
    expect(
      clear.compareDocumentPosition(download) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      download.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: content.archive.clear }),
    );

    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeInTheDocument();
  });

  it("opens a file from its row in the lightbox on a narrow screen, without an eye button", async () => {
    mocks.getDownloadUrl.mockResolvedValue({
      ok: true,
      value: "https://blob.test/offer.pdf",
    });
    renderView();

    expect(
      screen.queryByRole("button", { name: "Preview Offer.pdf" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Offer.pdf" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows a chosen file next to the list on a wide screen instead of the lightbox", async () => {
    stubWideScreen(true);
    mocks.getDownloadUrl.mockResolvedValue({
      ok: true,
      value: "https://blob.test/logo.png",
    });
    renderView({
      initialPage: page([
        file({
          id: "image-1",
          assetKind: AssetKind.Image,
          displayName: "Logo.png",
          extension: UploadExtension.Png,
        }),
      ]),
    });
    const panel = screen.getByRole("complementary", {
      name: content.panel.label,
    });
    expect(within(panel).getByText(content.panel.empty)).toBeInTheDocument();
    expect(mocks.getDownloadUrl).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Logo.png" }));

    expect(window.location.search).toBe("?file=image-1");
    expect(
      await within(panel).findByRole("img", { name: "Logo.png" }),
    ).toBeInTheDocument();
    expect(mocks.getDownloadUrl).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Logo.png" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: content.tabs.fromYou }));

    expect(window.location.search).toBe("?tab=fromYou");
    expect(within(panel).getByText(content.panel.empty)).toBeInTheDocument();
  });

  it("keeps the lightbox and renders no panel on a narrow screen", () => {
    stubWideScreen(false);
    renderView();

    expect(
      screen.queryByRole("complementary", { name: content.panel.label }),
    ).toBeNull();
  });

  it.each(["preview", "add"])(
    "pauses the panel video while the %s dialog is open without restarting it on close",
    async (dialogKind) => {
      stubWideScreen(true);
      mocks.getDownloadUrl.mockResolvedValue({
        ok: true,
        value: "https://blob.test/clip.mp4",
      });
      renderView({
        initialPage: page([
          file({
            id: "video-1",
            assetKind: AssetKind.Video,
            displayName: "clip.mp4",
            extension: UploadExtension.Mp4,
          }),
        ]),
      });
      fireEvent.click(screen.getByRole("button", { name: "clip.mp4" }));
      const panel = screen.getByRole("complementary", {
        name: content.panel.label,
      });
      await waitFor(() => expect(panel.querySelector("video")).not.toBeNull());
      const video = panel.querySelector("video")!;
      video.currentTime = 12;
      const pause = vi
        .spyOn(video, "pause")
        .mockImplementation(() => undefined);
      const play = vi.spyOn(video, "play").mockResolvedValue(undefined);

      fireEvent.click(
        screen.getByRole("button", {
          name:
            dialogKind === "preview"
              ? content.panel.expand
              : content.actions.add,
        }),
      );
      const dialog = await screen.findByRole("dialog");
      expect(pause).toHaveBeenCalledOnce();
      expect(panel.querySelector("video")).toBe(video);
      expect(video.currentTime).toBe(12);

      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(video.currentTime).toBe(12);
      expect(play).not.toHaveBeenCalled();
      pause.mockRestore();
      play.mockRestore();
    },
  );

  it("switches between the project and all projects without a server navigation", async () => {
    renderView({
      projects: [{ id: "project-1", title: "Relaunch" }],
      selectedProjectId: "project-1",
    });
    const list = screen.getByRole("list", { name: content.list.label });
    expect(within(list).queryByText("Relaunch")).toBeNull();
    expect(screen.getByRole("radio", { name: "Relaunch" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByRole("radio", { name: content.scope.all }));

    expect(window.location.search).toBe("?scope=all");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.listFiles).toHaveBeenCalledWith(
      "customer-1",
      PortalFileOrigin.FromUs,
      1,
      null,
    );
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
    expect(
      screen.getByRole("tab", { name: content.tabs.fromYou }),
    ).toHaveAttribute("aria-selected", "true");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("explains the empty tabs by their purpose", async () => {
    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1/files?tab=fromYou",
    );
    renderView({ initialPage: page([]) });

    expect(
      await screen.findByText(content.empty.fromYou.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.empty.fromYou.description),
    ).toBeInTheDocument();
  });

  it("explains the empty tabs by their purpose to read-only contacts", async () => {
    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1/files?tab=fromYou",
    );
    renderView({ canUpload: false, initialPage: page([]) });

    expect(
      await screen.findByText(content.empty.fromYou.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.empty.fromYou.readOnlyDescription),
    ).toBeInTheDocument();
    expect(mocks.listFiles).toHaveBeenCalledWith(
      "customer-1",
      PortalFileOrigin.FromYou,
      1,
      null,
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

    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1/files?tab=fromYou",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    view.rerender(
      <PortalFilesView
        canUpload
        dashboardHref="/en/portal/customer-1"
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
    expect(screen.queryByText(content.archive.videoHint)).toBeNull();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Offer.pdf for the ZIP" }),
    );

    expect(screen.getByText(content.archive.videoHint)).toBeInTheDocument();
  });
});
