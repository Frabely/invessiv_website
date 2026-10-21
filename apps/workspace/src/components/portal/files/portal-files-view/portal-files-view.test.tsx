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
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { PortalFileOriginFilter } from "@/common/constants/portal/portal-file-origin-filter";
import { PortalFilesQueryParam } from "@/common/constants/portal/portal-files-query-params";
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
    thumbnailUrl: null,
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
      dashboardPath="/en/portal/customer-1"
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      initialPage={page([file()])}
      initialOriginFilter={PortalFileOriginFilter.All}
      locale="en"
      projects={[]}
      {...props}
    />,
  );
}

function choose(selectLabel: string, optionLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: selectLabel }));
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

function seedSelection(ids: readonly string[]) {
  const params = new URLSearchParams({
    [PortalFilesQueryParam.Selected]: `customer-1:${ids.join(",")}`,
  });
  window.history.replaceState(null, "", `?${params.toString()}`);
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

  it("shows the server-rendered files of both origins as table columns without reloading them", () => {
    renderView({
      initialPage: page([
        file(),
        file({
          id: "file-2",
          displayName: "Logo.svg",
          origin: PortalFileOrigin.FromYou,
          extension: UploadExtension.Svg,
          note: null,
          projectId: null,
          projectTitle: null,
        }),
      ]),
    });

    expect(
      screen.getByRole("heading", { level: 1, name: content.page.heading }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: content.list.label });
    for (const column of [
      content.table.columns.name,
      content.table.columns.origin,
      content.table.columns.project,
      content.table.columns.type,
      content.table.columns.size,
      content.table.columns.added,
    ])
      expect(
        within(table).getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    const offer = within(table).getByRole("row", { name: /Offer\.pdf/ });
    expect(within(offer).getByText("Final version")).toBeInTheDocument();
    expect(within(offer).getByText(content.origin.fromUs)).toBeInTheDocument();
    expect(within(offer).getByText("Relaunch")).toBeInTheDocument();
    expect(within(offer).getByText("PDF")).toBeInTheDocument();
    expect(within(offer).getByText("2 kB")).toBeInTheDocument();
    const logo = within(table).getByRole("row", { name: /Logo\.svg/ });
    expect(within(logo).getByText(content.origin.fromYou)).toBeInTheDocument();
    expect(within(logo).getByText(content.row.general)).toBeInTheDocument();
    expect(mocks.listFiles).not.toHaveBeenCalled();
  });

  it("shows an image's preview in its table row and keeps the icon for documents", () => {
    renderView({
      initialPage: page([
        file(),
        file({
          id: "file-2",
          displayName: "Moodboard.jpg",
          assetKind: AssetKind.Image,
          extension: UploadExtension.Jpg,
          thumbnailUrl: "https://storage.invalid/moodboard.thumb.webp",
        }),
      ]),
    });

    const table = screen.getByRole("table", { name: content.list.label });
    const image = within(table).getByRole("row", { name: /Moodboard\.jpg/ });
    expect(image.querySelector("img")).toHaveAttribute(
      "src",
      "https://storage.invalid/moodboard.thumb.webp",
    );
    const offer = within(table).getByRole("row", { name: /Offer\.pdf/ });
    expect(offer.querySelector("img")).not.toBeInTheDocument();
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
    unmount();

    renderView({ canUpload: false });
    expect(
      screen.queryByRole("button", { name: content.actions.add }),
    ).toBeNull();
  });

  it("floats the ZIP actions over the page while the add action stays in the bar", () => {
    renderView();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Offer.pdf for the ZIP" }),
    );

    const bar = screen.getByRole("region", { name: "1 selected" });
    expect(
      within(bar).getByRole("button", { name: content.archive.clear }),
    ).toBeInTheDocument();
    expect(
      within(bar).getByRole("button", { name: content.archive.download }),
    ).toBeInTheDocument();
    expect(
      within(bar).queryByRole("button", { name: content.actions.add }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(bar).getByRole("button", { name: content.archive.clear }),
    );

    expect(screen.queryByRole("region", { name: "1 selected" })).toBeNull();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeInTheDocument();
  });

  it("selects and clears every shown file except videos from the table head", () => {
    renderView({
      initialPage: page([
        file(),
        file({ id: "file-2", displayName: "Brief.pdf" }),
        file({
          id: "video-1",
          assetKind: AssetKind.Video,
          displayName: "clip.mp4",
          extension: UploadExtension.Mp4,
        }),
      ]),
    });
    const all = screen.getByRole("checkbox", {
      name: content.table.selectAll,
    });

    fireEvent.click(all);

    expect(
      screen.getByRole("region", { name: "2 selected" }),
    ).toBeInTheDocument();
    expect(all).toBeChecked();

    fireEvent.click(all);

    expect(screen.queryByRole("region")).toBeNull();
    expect(all).not.toBeChecked();
  });

  it("clears the shown selection from the table head after reaching the ZIP limit", () => {
    renderView({
      initialPage: page(
        Array.from({ length: MAX_ARCHIVE_FILES + 25 }, (_, index) =>
          file({ id: `file-${index}` }),
        ),
      ),
    });
    const all = screen.getByRole("checkbox", { name: content.table.selectAll });

    fireEvent.click(all);

    expect(
      screen.getByRole("region", { name: "100 selected" }),
    ).toBeInTheDocument();
    expect(all).toBePartiallyChecked();

    fireEvent.click(all);

    expect(screen.queryByRole("region")).toBeNull();
    expect(all).not.toBePartiallyChecked();
    expect(all).not.toBeChecked();
  });

  it("disables selecting shown files when other filters already fill the ZIP limit", () => {
    seedSelection(
      Array.from(
        { length: MAX_ARCHIVE_FILES },
        (_, index) => `hidden-${index}`,
      ),
    );
    renderView();

    const all = screen.getByRole("checkbox", { name: content.table.selectAll });
    expect(all).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: content.archive.clear }),
    );

    expect(all).toBeEnabled();
    fireEvent.click(all);
    expect(
      screen.getByRole("region", { name: "1 selected" }),
    ).toBeInTheDocument();
  });

  it("preserves files from other filters when clearing shown files at the ZIP limit", () => {
    const hidden = Array.from(
      { length: MAX_ARCHIVE_FILES - 1 },
      (_, index) => `hidden-${index}`,
    );
    seedSelection([...hidden, "file-1"]);
    renderView({ initialPage: page([file(), file({ id: "file-2" })]) });
    const all = screen.getByRole("checkbox", { name: content.table.selectAll });

    expect(all).toBePartiallyChecked();
    expect(all).toBeEnabled();
    fireEvent.click(all);

    expect(
      screen.getByRole("region", { name: "99 selected" }),
    ).toBeInTheDocument();
    expect(
      new URLSearchParams(window.location.search).get(
        PortalFilesQueryParam.Selected,
      ),
    ).toBe(`customer-1:${hidden.join(",")}`);
  });

  it("opens a file from anywhere in its row in the lightbox on a narrow screen", async () => {
    mocks.getDownloadUrl.mockResolvedValue({
      ok: true,
      value: "https://blob.test/offer.pdf",
    });
    renderView();

    fireEvent.click(screen.getByText("PDF"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows a chosen file next to the table on a wide screen instead of the lightbox", async () => {
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

    choose(content.origin.label, content.origin.fromYou);

    expect(window.location.search).toBe("?origin=fromYou");
    expect(within(panel).getByText(content.panel.empty)).toBeInTheDocument();
  });

  it("shows a link in the panel on a wide screen instead of leaving the page", () => {
    stubWideScreen(true);
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

    fireEvent.click(screen.getByRole("button", { name: "Brand film" }));

    const panel = screen.getByRole("complementary", {
      name: content.panel.label,
    });
    expect(
      within(panel).getByRole("heading", { name: "Brand film" }),
    ).toBeInTheDocument();
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

  it("switches between projects and all projects without a server navigation", () => {
    renderView({
      projects: [
        { id: "project-1", title: "Relaunch" },
        { id: "project-2", title: "Shop" },
      ],
      selectedProjectId: "project-1",
    });
    expect(
      screen.queryByRole("columnheader", {
        name: content.table.columns.project,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: content.scope.label }),
    ).toHaveTextContent("Relaunch");

    choose(content.scope.label, content.scope.all);

    expect(window.location.search).toBe("?scope=all");
    expect(mocks.listFiles).toHaveBeenLastCalledWith(
      "customer-1",
      null,
      1,
      null,
    );

    choose(content.scope.label, "Shop");

    expect(window.location.search).toBe("?project=project-2");
    expect(mocks.listFiles).toHaveBeenLastCalledWith(
      "customer-1",
      null,
      1,
      "project-2",
    );
    expect(
      screen.getByRole("link", { name: content.page.back }),
    ).toHaveAttribute("href", "/en/portal/customer-1?project=project-2");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows the owner notice with a CRM link instead of the upload", () => {
    renderView({ canUpload: false, cockpitHref: "/en/crm?cockpit=customer-1" });

    expect(screen.getByText(content.owner.hint)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.owner.link }),
    ).toHaveAttribute("href", "/en/crm?cockpit=customer-1");
  });

  it("keeps the origin filter in the URL without a server navigation", () => {
    renderView();

    choose(content.origin.label, content.origin.fromYou);

    expect(window.location.pathname + window.location.search).toBe(
      "/en/portal/customer-1/files?origin=fromYou",
    );
    expect(
      screen.getByRole("button", { name: content.origin.label }),
    ).toHaveTextContent(content.origin.fromYou);
    expect(mocks.listFiles).toHaveBeenLastCalledWith(
      "customer-1",
      PortalFileOrigin.FromYou,
      1,
      null,
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("explains the empty page by its purpose", () => {
    renderView({ initialPage: page([]) });

    expect(screen.getByText(content.empty.all.title)).toBeInTheDocument();
    expect(screen.getByText(content.empty.all.description)).toBeInTheDocument();
  });

  it("explains an empty origin by its purpose to read-only contacts", async () => {
    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1/files?origin=fromYou",
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

  it("hides the previous files while the next filter loads or fails", async () => {
    let rejectNext: () => void = () => undefined;
    mocks.listFiles.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          rejectNext = () => resolve({ ok: false, code: "FILE_NOT_FOUND" });
        }),
    );
    renderView();
    expect(screen.getByText("Offer.pdf")).toBeInTheDocument();

    choose(content.origin.label, content.origin.fromYou);

    expect(screen.queryByText("Offer.pdf")).toBeNull();
    expect(screen.getByText(content.list.loading)).toBeInTheDocument();

    rejectNext();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.list.loadError,
    );
    expect(screen.queryByText("Offer.pdf")).toBeNull();
  });

  it("opens links in a new tab on a narrow screen and offers no download for them", () => {
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

  it("never offers videos for the ZIP and says so in the selection bar", () => {
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
      screen.queryByRole("checkbox", { name: "Select clip.mp4 for the ZIP" }),
    ).toBeNull();
    expect(screen.queryByText(content.archive.videoHint)).toBeNull();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select Offer.pdf for the ZIP" }),
    );

    expect(screen.getByText(content.archive.videoHint)).toBeInTheDocument();
  });
});
