// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { PortalFilesViewProps } from "@/components/portal/files/portal-files-view/portal-files-view";
import PortalFilesPage, { generateMetadata } from "./page";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requirePortalReader: vi.fn(),
  listPortalFiles: vi.fn(),
  listPortalFileProjects: vi.fn(),
  listPortalCurrentProjects: vi.fn(),
  isPortalOwnerView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  viewProps: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/server/portal/auth/require-portal-reader", () => ({
  requirePortalReader: mocks.requirePortalReader,
}));
vi.mock("@/server/portal/auth/portal-owner-view", () => ({
  isPortalOwnerView: mocks.isPortalOwnerView,
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-files.query-handler",
  () => ({ listPortalFiles: mocks.listPortalFiles }),
);
vi.mock(
  "@/server/portal/query-handler/list-portal-file-projects.query-handler",
  () => ({ listPortalFileProjects: mocks.listPortalFileProjects }),
);
vi.mock(
  "@/server/portal/query-handler/list-portal-current-projects.query-handler",
  () => ({
    listPortalCurrentProjects: mocks.listPortalCurrentProjects,
  }),
);
vi.mock(
  "@/components/portal/files/portal-files-view/portal-files-view",
  () => ({
    PortalFilesView: (props: PortalFilesViewProps) => {
      mocks.viewProps(props);
      return <div data-testid="files" />;
    },
  }),
);

const READER = {
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: "customer-1",
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalFilesRead,
    Permission.PortalFilesWrite,
  ]),
  projectPermissions: new Map(),
};

const PAGE = { files: [], total: 0, page: 1, pageSize: 25 };

async function renderPage(
  tab?: string,
  customerId = "customer-1",
  project?: string,
  scope?: string,
) {
  render(
    await PortalFilesPage({
      params: Promise.resolve({ locale: "de", customerId }),
      searchParams: Promise.resolve({
        ...(tab ? { tab } : {}),
        ...(project ? { project } : {}),
        ...(scope ? { scope } : {}),
      }),
    }),
  );
  return mocks.viewProps.mock.calls.at(-1)![0] as PortalFilesViewProps;
}

describe("PortalFilesPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockClear());
    mocks.requirePortalReader.mockResolvedValue(READER);
    mocks.listPortalFiles.mockResolvedValue({ ok: true, value: PAGE });
    mocks.listPortalFileProjects.mockResolvedValue([
      { id: "project-1", title: "Relaunch" },
    ]);
    mocks.listPortalCurrentProjects.mockResolvedValue([]);
    mocks.isPortalOwnerView.mockReturnValue(false);
  });

  afterEach(cleanup);

  it("loads the tab from the URL for the resolved reader only", async () => {
    const props = await renderPage("fromYou", "CUSTOMER-1");

    expect(mocks.requirePortalReader).toHaveBeenCalledWith("de", "customer-1");
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(READER, {
      origin: PortalFileOrigin.FromYou,
      projectId: undefined,
    });
    expect(props.initialTab).toBe(PortalFileOrigin.FromYou);
    expect(props.initialPage).toBe(PAGE);
    expect(props.projects).toEqual([{ id: "project-1", title: "Relaunch" }]);
    expect(props.canUpload).toBe(true);
    expect(props.cockpitHref).toBeNull();
  });

  it("falls back to the released files for an unknown tab", async () => {
    const props = await renderPage("internal");

    expect(props.initialTab).toBe(PortalFileOrigin.FromUs);
  });

  it("scopes files to the selected project including the default", async () => {
    mocks.listPortalFileProjects.mockResolvedValue([
      { id: "project-1", title: "Relaunch" },
      { id: "project-2", title: "Shop" },
    ]);
    mocks.listPortalCurrentProjects.mockResolvedValue([
      { id: "project-1", title: "Relaunch" },
      { id: "project-2", title: "Shop" },
    ]);
    const props = await renderPage(undefined, "customer-1", "project-2");
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(READER, {
      origin: PortalFileOrigin.FromUs,
      projectId: "project-2",
    });
    expect(props.selectedProjectId).toBe("project-2");
    const fallback = await renderPage(
      undefined,
      "customer-1",
      "foreign-project",
    );
    expect(fallback.selectedProjectId).toBe("project-1");
  });

  it("keeps a completed project's file link scoped to that project", async () => {
    mocks.listPortalFileProjects.mockResolvedValue([
      { id: "project-current", title: "Current" },
      { id: "project-completed", title: "Completed" },
    ]);
    mocks.listPortalCurrentProjects.mockResolvedValue([
      { id: "project-current", title: "Current" },
    ]);

    const props = await renderPage(
      undefined,
      "customer-1",
      "project-completed",
    );

    expect(props.selectedProjectId).toBe("project-completed");
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(READER, {
      origin: PortalFileOrigin.FromUs,
      projectId: "project-completed",
    });
  });

  it("does not send a task-only project filter to the files query", async () => {
    mocks.listPortalFileProjects.mockResolvedValue([]);
    mocks.listPortalCurrentProjects.mockResolvedValue([
      { id: "task-project", title: "Tasks" },
    ]);

    const props = await renderPage();

    expect(props.selectedProjectId).toBeNull();
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(READER, {
      origin: PortalFileOrigin.FromUs,
      projectId: undefined,
    });
  });

  it("lists all projects only when requested", async () => {
    mocks.listPortalCurrentProjects.mockResolvedValue([
      { id: "project-1", title: "Relaunch" },
    ]);
    const props = await renderPage(undefined, "customer-1", "project-1", "all");
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(READER, {
      origin: PortalFileOrigin.FromUs,
      projectId: undefined,
    });
    expect(props.allProjects).toBe(true);
  });

  it("answers 404 without portal.files.read", async () => {
    mocks.listPortalFiles.mockResolvedValue({
      ok: false,
      code: FileApiErrorCode.NotFound,
    });

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.viewProps).not.toHaveBeenCalled();
  });

  it("hides the upload without portal.files.write", async () => {
    mocks.requirePortalReader.mockResolvedValue({
      ...READER,
      permissions: new Set([Permission.PortalFilesRead]),
    });

    const props = await renderPage();

    expect(props.canUpload).toBe(false);
  });

  it("never lets the owner view upload and links it to the CRM", async () => {
    mocks.isPortalOwnerView.mockReturnValue(true);

    const props = await renderPage();

    expect(props.canUpload).toBe(false);
    expect(props.cockpitHref).toBe("/de/crm?cockpit=customer-1");
  });

  it("returns localized no-index metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", customerId: "customer-1" }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.title).toBe("Files | Invessiv");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});
