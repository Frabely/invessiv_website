import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { files } from "@invessiv/db/record-configuration";
import { FilesConstraintName as N } from "@invessiv/db/constraint-names/crm/files-constraint-names";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { UPLOAD_CONTENT_TYPES } from "@invessiv/common/constants/files/upload-content-types";
import { createFileTestFixture } from "../../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));
describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "file database constraints",
  () => {
    const f = createFileTestFixture();
    beforeAll(f.setup, 60_000);
    afterAll(f.cleanup, 60_000);
    const row = (): typeof files.$inferInsert => ({
      id: crypto.randomUUID(),
      customer_id: f.customerId,
      project_id: f.projectId,
      source: FileSource.Link,
      status: FileStatus.Ready,
      asset_kind: AssetKind.Link,
      display_name: "fixture:files:link",
      visible_to_customer: false,
      uploaded_by_side: UploadSide.Internal,
      uploaded_by_member_id: f.memberId,
      url: "https://example.com",
      version: 1,
    });
    const upload = (): typeof files.$inferInsert => ({
      ...row(),
      source: FileSource.Upload,
      status: FileStatus.Pending,
      asset_kind: AssetKind.Document,
      url: null,
      storage_key: `fixture:files:${crypto.randomUUID()}`,
      content_type: UPLOAD_CONTENT_TYPES[UploadExtension.Txt],
      extension: UploadExtension.Txt,
      size_bytes: 1,
      inspection_status: FileInspectionStatus.Unscanned,
    });

    it.each([
      [N.DisplayNameCheck, { display_name: "  " }],
      [N.NoteCheck, { note: "x".repeat(201) }],
      [N.UrlCheck, { url: "http://example.com" }],
      [N.UrlCheck, { url: "https://example.com/" + "x".repeat(2048) }],
      [N.VersionCheck, { version: 0 }],
      [N.SourceFieldsCheck, { status: FileStatus.Pending }],
      [N.SourceFieldsCheck, { asset_kind: AssetKind.Image }],
      [N.SourceFieldsCheck, { storage_key: "unexpected" }],
      [N.SourceFieldsCheck, { url: null }],
      [N.UploaderCheck, { uploaded_by_member_id: null }],
      [
        N.UploaderCheck,
        { uploaded_by_side: UploadSide.Customer, visible_to_customer: true },
      ],
    ] as const)("enforces %s", async (constraint, patch) => {
      await expect(
        f
          .database()
          .insert(files)
          .values({ ...row(), ...patch }),
      ).rejects.toMatchObject({ cause: { constraint } });
    });
    it("enforces the composite project/customer foreign key", async () => {
      await expect(
        f
          .database()
          .insert(files)
          .values({ ...row(), project_id: f.foreignProjectId }),
      ).rejects.toMatchObject({
        cause: { constraint: N.ProjectCustomerForeignKey },
      });
    });
    it("requires exactly one matching uploader and keeps customer files visible", async () => {
      const customerRow = {
        ...row(),
        uploaded_by_side: UploadSide.Customer,
        uploaded_by_member_id: null,
        uploaded_by_portal_membership_id: f.membershipId,
        visible_to_customer: true,
      };
      await f.database().insert(files).values(customerRow);
      await expect(
        f
          .database()
          .insert(files)
          .values({
            ...customerRow,
            id: crypto.randomUUID(),
            visible_to_customer: false,
          }),
      ).rejects.toMatchObject({
        cause: { constraint: N.CustomerVisibleCheck },
      });
      await expect(
        f
          .database()
          .insert(files)
          .values({
            ...customerRow,
            id: crypto.randomUUID(),
            uploaded_by_member_id: f.memberId,
          }),
      ).rejects.toMatchObject({ cause: { constraint: N.UploaderCheck } });
    });
    it("rejects invalid upload size, missing metadata and duplicate storage keys", async () => {
      await expect(
        f
          .database()
          .insert(files)
          .values({ ...upload(), size_bytes: 0 }),
      ).rejects.toMatchObject({ cause: { constraint: N.SizeCheck } });
      for (const key of [
        "storage_key",
        "content_type",
        "extension",
        "size_bytes",
        "inspection_status",
      ] as const) {
        await expect(
          f
            .database()
            .insert(files)
            .values({ ...upload(), [key]: null }),
        ).rejects.toMatchObject({ cause: { constraint: N.SourceFieldsCheck } });
      }
      const first = upload();
      await f.database().insert(files).values(first);
      await expect(
        f
          .database()
          .insert(files)
          .values({ ...upload(), storage_key: first.storage_key }),
      ).rejects.toMatchObject({ cause: { constraint: N.StorageKeyUnique } });
    });
    it("has no implicit defaults for mandatory business fields", async () => {
      for (const key of [
        "id",
        "customer_id",
        "source",
        "status",
        "asset_kind",
        "display_name",
        "visible_to_customer",
        "uploaded_by_side",
        "version",
      ]) {
        // Deliberately malformed input verifies the database boundary, bypassing TypeScript.
        const malformed = Object.fromEntries(
          Object.entries(row()).filter(([field]) => field !== key),
        ) as typeof files.$inferInsert;
        await expect(
          f.database().insert(files).values(malformed),
        ).rejects.toMatchObject({ cause: { code: "23502", column: key } });
      }
    });
  },
);
