import { describe, expect, it } from "vitest";
import type { files } from "@invessiv/db/record-configuration";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { fileMappingService } from "@/server/workspace/crm/services/files/file-mapping-service";

describe("file mapping", () => {
  const row: typeof files.$inferSelect = {
    id: "file",
    customer_id: "customer",
    project_id: "project",
    feedback_round_id: null,
    source: FileSource.Upload,
    status: FileStatus.Ready,
    asset_kind: AssetKind.Document,
    display_name: "brief.txt",
    note: "annotation",
    visible_to_customer: false,
    uploaded_by_side: UploadSide.Internal,
    uploaded_by_member_id: "member",
    uploaded_by_portal_membership_id: null,
    storage_key: "secret-storage-coordinate",
    content_type: "text/plain",
    extension: UploadExtension.Txt,
    size_bytes: 12,
    inspection_status: FileInspectionStatus.Unscanned,
    url: null,
    orphaned_at: null,
    version: 3,
    created_at: new Date("2026-09-28T10:00:00Z"),
    updated_at: new Date("2026-09-28T11:00:00Z"),
  };
  it("maps every public field without leaking storage or cleanup state", () => {
    expect(fileMappingService.toDto(row)).toEqual({
      id: "file",
      customerId: "customer",
      projectId: "project",
      source: FileSource.Upload,
      status: FileStatus.Ready,
      assetKind: AssetKind.Document,
      displayName: "brief.txt",
      note: "annotation",
      visibleToCustomer: false,
      uploadedBySide: UploadSide.Internal,
      uploadedByMemberId: "member",
      uploadedByPortalMembershipId: null,
      contentType: "text/plain",
      extension: UploadExtension.Txt,
      sizeBytes: 12,
      inspectionStatus: FileInspectionStatus.Unscanned,
      url: null,
      version: 3,
      createdAt: "2026-09-28T10:00:00.000Z",
      updatedAt: "2026-09-28T11:00:00.000Z",
    });
  });
  it("preserves nullable link metadata and portal uploader attribution", () => {
    expect(
      fileMappingService.toDto({
        ...row,
        project_id: null,
        note: null,
        source: FileSource.Link,
        asset_kind: AssetKind.Link,
        uploaded_by_side: UploadSide.Customer,
        uploaded_by_member_id: null,
        uploaded_by_portal_membership_id: "membership",
        content_type: null,
        extension: null,
        size_bytes: null,
        inspection_status: null,
        storage_key: null,
        url: "https://example.com",
        visible_to_customer: true,
      }),
    ).toMatchObject({
      projectId: null,
      note: null,
      contentType: null,
      extension: null,
      sizeBytes: null,
      inspectionStatus: null,
      uploadedByMemberId: null,
      uploadedByPortalMembershipId: "membership",
      url: "https://example.com",
    });
  });
});
