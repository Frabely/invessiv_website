// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import { getCrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerFilesList } from "./customer-files-list";

const content = getCrmFilesDictionary("en");

function file(id: string, kind: AssetKind): FileDto {
  return {
    id,
    customerId: "customer-1",
    projectId: null,
    source: FileSource.Upload,
    status: FileStatus.Ready,
    assetKind: kind,
    displayName: `${id}.pdf`,
    note: null,
    visibleToCustomer: false,
    uploadedBySide: UploadSide.Internal,
    uploadedByMemberId: null,
    uploadedByPortalMembershipId: null,
    contentType: "application/pdf",
    extension: "pdf",
    sizeBytes: 100,
    inspectionStatus: FileInspectionStatus.Unscanned,
    url: null,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

afterEach(cleanup);

describe("CustomerFilesList", () => {
  it("keeps selected files removable while the archive is full and excludes videos", () => {
    const files = [
      file("selected", AssetKind.Document),
      file("new", AssetKind.Document),
      file("video", AssetKind.Video),
    ];
    render(
      <CustomerFilesList
        canDeleteAction={() => false}
        canEditAction={() => false}
        canWrite={false}
        content={content}
        files={files}
        filterIsActive={false}
        hasMore={false}
        locale="en"
        memberNames={new Map()}
        onDeleteAction={vi.fn()}
        onDownloadAction={vi.fn()}
        onEditAction={vi.fn()}
        onLoadMoreAction={vi.fn()}
        onPreviewAction={vi.fn()}
        onReloadAction={vi.fn()}
        onResetAction={vi.fn()}
        onSelectAction={vi.fn()}
        projects={[]}
        selectedIds={[
          "selected",
          ...Array.from(
            { length: MAX_ARCHIVE_FILES - 1 },
            (_, index) => `other-${index}`,
          ),
        ]}
        status={FileListLoadStatus.Ready}
        total={3}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Select selected.pdf for ZIP" }),
    ).toBeChecked();
    expect(
      screen.queryByRole("checkbox", { name: "Select new.pdf for ZIP" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Select video.pdf for ZIP" }),
    ).not.toBeInTheDocument();
  });
});
