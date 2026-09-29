import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import type { files } from "@invessiv/db/record-configuration";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";

const CREATED = new Date("2026-09-28T10:00:00.000Z");

function row(
  overrides: Partial<typeof files.$inferSelect> = {},
): typeof files.$inferSelect {
  return {
    id: "file-1",
    customer_id: "customer-1",
    project_id: "project-1",
    feedback_round_id: null,
    source: FileSource.Upload,
    status: FileStatus.Ready,
    asset_kind: AssetKind.Document,
    display_name: "Offer.pdf",
    note: "Final version",
    visible_to_customer: true,
    uploaded_by_side: UploadSide.Internal,
    uploaded_by_member_id: "member-1",
    uploaded_by_portal_membership_id: null,
    storage_key: "customers/customer-1/file-1/Offer.pdf",
    content_type: "application/pdf",
    extension: UploadExtension.Pdf,
    size_bytes: 2048,
    inspection_status: FileInspectionStatus.Unscanned,
    url: null,
    orphaned_at: null,
    version: 3,
    created_at: CREATED,
    updated_at: CREATED,
    ...overrides,
  };
}

describe("portalFileMappingService.toDto", () => {
  it("maps released columns only", () => {
    const dto = portalFileMappingService.toDto(row(), "Relaunch");

    expect(dto).toEqual({
      id: "file-1",
      projectId: "project-1",
      projectTitle: "Relaunch",
      source: FileSource.Upload,
      assetKind: AssetKind.Document,
      displayName: "Offer.pdf",
      note: "Final version",
      origin: PortalFileOrigin.FromUs,
      extension: UploadExtension.Pdf,
      sizeBytes: 2048,
      url: null,
      createdAt: "2026-09-28T10:00:00.000Z",
    });
    expect(JSON.stringify(dto)).not.toContain("customers/customer-1");
    expect(JSON.stringify(dto)).not.toContain("member-1");
  });

  it("marks customer uploads as their own and keeps nullable fields null", () => {
    const dto = portalFileMappingService.toDto(
      row({
        project_id: null,
        note: null,
        source: FileSource.Link,
        asset_kind: AssetKind.Link,
        uploaded_by_side: UploadSide.Customer,
        uploaded_by_member_id: null,
        uploaded_by_portal_membership_id: "membership-1",
        storage_key: null,
        content_type: null,
        extension: null,
        size_bytes: null,
        inspection_status: null,
        url: "https://drive.google.com/file/1",
      }),
      "ignored for company-wide entries",
    );

    expect(dto).toMatchObject({
      projectId: null,
      projectTitle: null,
      note: null,
      origin: PortalFileOrigin.FromYou,
      extension: null,
      sizeBytes: null,
      url: "https://drive.google.com/file/1",
    });
    expect(JSON.stringify(dto)).not.toContain("membership-1");
  });
});
