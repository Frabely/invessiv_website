import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { FileOrigin } from "@invessiv/common/constants/files/file-origin";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { MAX_UPLOAD_FILES } from "@invessiv/common/constants/files/upload-limits";
import { MAX_ARCHIVE_BYTES } from "@/common/constants/files/file-archive-limits";
import { activities, files } from "@invessiv/db/record-configuration";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import { StorageError } from "@invessiv/storage";
import { storageService } from "@/server/shared/files/storage-service";
import { createFileUpload } from "@/server/workspace/crm/command-handler/create-file-upload.command-handler";
import { completeFileUpload } from "@/server/workspace/crm/command-handler/complete-file-upload.command-handler";
import { createFileLink } from "@/server/workspace/crm/command-handler/create-file-link.command-handler";
import { updateFile } from "@/server/workspace/crm/command-handler/update-file.command-handler";
import { deleteFile } from "@/server/workspace/crm/command-handler/delete-file.command-handler";
import { listCustomerFiles } from "@/server/workspace/crm/query-handler/list-customer-files.query-handler";
import { getFileDownloadUrl } from "@/server/workspace/crm/query-handler/get-file-download-url.query-handler";
import { downloadFile } from "@/server/workspace/crm/query-handler/download-file.query-handler";
import { createFilesArchive } from "@/server/workspace/crm/query-handler/create-files-archive.query-handler";
import { createFileTestFixture } from "../../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));
describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "files PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const memory = createInMemoryStorage();
    beforeAll(async () => {
      await f.setup();
      vi.spyOn(storageService, "getAdapter").mockReturnValue(memory.adapter);
    }, 60_000);
    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
    }, 60_000);
    const link = (overrides = {}) => ({
      displayName: "Design",
      url: "https://example.com/design",
      projectId: f.projectId,
      ...overrides,
    });
    const restricted = () =>
      f.actor({
        permissions: new Set(),
        projectPermissions: new Map([
          [
            f.projectId,
            {
              customerId: f.customerId,
              permissions: new Set([
                Permission.FilesRead,
                Permission.FilesWrite,
                Permission.FilesDelete,
              ]),
            },
          ],
        ]),
      });

    async function upload(name = "brief.txt", content = "brief") {
      const bytes = new TextEncoder().encode(content);
      const ticket = await createFileUpload(
        f.customerId,
        { displayName: name, sizeBytes: bytes.length, projectId: f.projectId },
        f.actor(),
      );
      if (!ticket.ok) throw new Error("Expected upload ticket");
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, ticket.value.file.id));
      memory.seed(row.storage_key!, bytes, row.content_type!);
      return { row, ticket };
    }

    it("preflights archive IDs against customer and project scope before streaming", async () => {
      const own = await createFileLink(f.customerId, link(), f.actor());
      const foreign = await createFileLink(
        f.foreignCustomerId,
        link({ projectId: f.foreignProjectId }),
        f.actor(),
      );
      if (!own.ok || !foreign.ok)
        throw new Error("Expected archive fixture links");
      expect(
        await createFilesArchive(f.customerId, [own.value.id], restricted()),
      ).toMatchObject({ ok: true });
      expect(
        await createFilesArchive(
          f.customerId,
          [own.value.id, foreign.value.id],
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFilesArchive(
          f.customerId,
          [own.value.id],
          f.actor({ permissions: new Set() }),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFilesArchive(
          f.customerId,
          [own.value.id, own.value.id],
          f.actor(),
        ),
      ).toMatchObject({ code: E.Validation });

      const binary = await upload();
      await completeFileUpload(binary.row.id, f.actor());
      await f
        .database()
        .update(files)
        .set({ size_bytes: MAX_ARCHIVE_BYTES + 1 })
        .where(eq(files.id, binary.row.id));
      expect(
        await createFilesArchive(f.customerId, [binary.row.id], f.actor()),
      ).toMatchObject({ code: E.ArchiveLimit });
      await f
        .database()
        .update(files)
        .set({ asset_kind: AssetKind.Video })
        .where(eq(files.id, binary.row.id));
      expect(
        await createFilesArchive(f.customerId, [binary.row.id], f.actor()),
      ).toMatchObject({ code: E.ArchiveVideo });
    });

    it("creates internal links without fetching their destination and rejects unsafe URLs", async () => {
      const fetch = vi.spyOn(globalThis, "fetch");
      const created = await createFileLink(f.customerId, link(), f.actor());
      expect(created).toMatchObject({
        ok: true,
        value: {
          visibleToCustomer: false,
          version: 1,
          status: FileStatus.Ready,
        },
      });
      expect(fetch).not.toHaveBeenCalled();
      fetch.mockRestore();
      expect(
        await createFileLink(
          f.customerId,
          link({ url: "http://example.com" }),
          f.actor(),
        ),
      ).toMatchObject({ code: E.Validation });
    });
    it("denies foreign customers, projects, customer-wide creation and actors without permissions", async () => {
      expect(
        await createFileLink(
          f.foreignCustomerId,
          link({ projectId: f.foreignProjectId }),
          restricted(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFileLink(
          f.customerId,
          link({ projectId: f.foreignProjectId }),
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFileLink(
          f.customerId,
          link({ projectId: null }),
          restricted(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFileUpload(
          f.customerId,
          { displayName: "x.txt", sizeBytes: 1, projectId: f.siblingProjectId },
          restricted(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createFileLink(
          f.customerId,
          link(),
          f.actor({ permissions: new Set() }),
        ),
      ).toMatchObject({ code: E.NotFound });
    });
    it("completes concurrent requests once and keeps pending files out of lists and downloads", async () => {
      const { row } = await upload();
      const pending = await listCustomerFiles(f.customerId, {}, f.actor());
      expect(
        pending.ok && pending.value.files.some((file) => file.id === row.id),
      ).toBe(false);
      expect(
        await getFileDownloadUrl(
          row.id,
          StorageDisposition.Attachment,
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      const results = await Promise.all([
        completeFileUpload(row.id, f.actor()),
        completeFileUpload(row.id, f.actor()),
      ]);
      expect(results.every((result) => result.ok)).toBe(true);
      const events = await f
        .database()
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.customer_id, f.customerId),
            eq(activities.type, ActivityType.FileUploaded),
          ),
        );
      expect(
        events.filter((event) => event.metadata?.file_id === row.id),
      ).toHaveLength(1);
      expect(JSON.stringify(events)).not.toContain(row.storage_key);
      expect(results[0]).toMatchObject({ value: { version: 2 } });
    });
    it("requires upload ownership and current scope even for repeated completion", async () => {
      const { row } = await upload();
      expect(
        await completeFileUpload(
          row.id,
          f.actor({ workspaceMemberId: crypto.randomUUID() }),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await completeFileUpload(row.id, f.actor({ permissions: new Set() })),
      ).toMatchObject({ code: E.NotFound });
      expect(await completeFileUpload(row.id, f.actor())).toMatchObject({
        ok: true,
      });
    });
    it("removes invalid content before removing its pending row", async () => {
      const { row } = await upload(
        "image.png",
        '<html lang="en">not a png</html>',
      );
      expect(await completeFileUpload(row.id, f.actor())).toMatchObject({
        code: FileErrorCode.InvalidSignature,
      });
      expect(await memory.adapter.head(row.storage_key!)).toBeNull();
      expect(
        await f.database().select().from(files).where(eq(files.id, row.id)),
      ).toHaveLength(0);
    });
    it("retains a recoverable pending row on cleanup failure and never publishes it", async () => {
      const { row } = await upload("image.png", "bad");
      const remove = vi
        .spyOn(memory.adapter, "delete")
        .mockRejectedValueOnce(new StorageError(StorageErrorCode.Unavailable));
      expect(await completeFileUpload(row.id, f.actor())).toMatchObject({
        code: E.StorageUnavailable,
      });
      remove.mockRestore();
      const [retained] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, row.id));
      expect(retained.orphaned_at).toBeInstanceOf(Date);
      expect(retained.status).toBe(FileStatus.Pending);
      expect(await completeFileUpload(row.id, f.actor())).toMatchObject({
        code: E.NotFound,
      });
    });
    it("keeps transient storage failures retryable", async () => {
      const { row } = await upload();
      const head = vi
        .spyOn(memory.adapter, "head")
        .mockRejectedValueOnce(new StorageError(StorageErrorCode.Unavailable));
      await expect(
        completeFileUpload(row.id, f.actor()),
      ).rejects.toBeInstanceOf(StorageError);
      head.mockRestore();
      expect(await completeFileUpload(row.id, f.actor())).toMatchObject({
        ok: true,
      });
    });
    it("requires permission on both sides of reassignment and returns safe conflicts", async () => {
      const created = await createFileLink(f.customerId, link(), f.actor());
      if (!created.ok) throw new Error("Expected link");
      const id = created.value.id;
      expect(
        await updateFile(id, { version: 1, projectId: null }, restricted()),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await updateFile(
          id,
          { version: 1, projectId: f.foreignProjectId },
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      const writes = await Promise.all([
        updateFile(id, { version: 1, note: "first" }, restricted()),
        updateFile(id, { version: 1, note: "second" }, restricted()),
      ]);
      expect(writes.filter((result) => result.ok)).toHaveLength(1);
      expect(writes.find((result) => !result.ok)).toMatchObject({
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { currentVersion: 2 },
      });
      expect(JSON.stringify(writes)).not.toContain("storage_key");
      expect(
        await updateFile(
          id,
          { version: 2, projectId: f.siblingProjectId },
          f.actor(),
        ),
      ).toMatchObject({ ok: true });
      expect(
        await updateFile(id, { version: 2, note: "steal" }, restricted()),
      ).toMatchObject({ code: E.NotFound });
    });
    it("filters literal search, origin and scope with pagination", async () => {
      await createFileLink(
        f.customerId,
        link({ displayName: "100%_unique", visibleToCustomer: true }),
        f.actor(),
      );
      await createFileLink(
        f.customerId,
        link({
          displayName: "100xxunique",
          visibleToCustomer: true,
          projectId: f.siblingProjectId,
        }),
        f.actor(),
      );
      const result = await listCustomerFiles(
        f.customerId,
        { search: "%_", origin: FileOrigin.Shared, pageSize: 1 },
        restricted(),
      );
      expect(result).toMatchObject({
        ok: true,
        value: { total: 1, files: [{ displayName: "100%_unique" }] },
      });
      expect(
        await listCustomerFiles(f.foreignCustomerId, {}, restricted()),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await listCustomerFiles(
          f.customerId,
          { projectId: f.foreignProjectId },
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await listCustomerFiles(
          f.customerId,
          { projectId: null },
          restricted(),
        ),
      ).toMatchObject({ code: E.NotFound });
    });
    it("does not hide customer entries but permits internal note edits", async () => {
      const created = await createFileLink(
        f.customerId,
        link({ visibleToCustomer: true }),
        f.actor(),
      );
      if (!created.ok) throw new Error("Expected link");
      // Fixture emulates the portal writer introduced in Task 55.
      await f
        .database()
        .update(files)
        .set({
          uploaded_by_side: UploadSide.Customer,
          uploaded_by_member_id: null,
          uploaded_by_portal_membership_id: f.membershipId,
        })
        .where(eq(files.id, created.value.id));
      expect(
        await updateFile(
          created.value.id,
          { version: 1, visibleToCustomer: false },
          f.actor(),
        ),
      ).toMatchObject({ code: E.CustomerVisibility });
      expect(
        await updateFile(
          created.value.id,
          { version: 1, note: "reviewed" },
          f.actor(),
        ),
      ).toMatchObject({ ok: true, value: { visibleToCustomer: true } });
    });
    it("signs only readable ready uploads and provides the authenticated proxy fallback", async () => {
      const { row } = await upload();
      await completeFileUpload(row.id, f.actor());
      expect(
        await getFileDownloadUrl(
          row.id,
          StorageDisposition.Attachment,
          f.actor({ permissions: new Set() }),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await getFileDownloadUrl(
          row.id,
          StorageDisposition.Attachment,
          restricted(),
        ),
      ).toMatchObject({ ok: true });
      const sign = vi
        .spyOn(memory.adapter, "createDownloadUrl")
        .mockRejectedValueOnce(
          new StorageError(StorageErrorCode.ProxyRequired),
        );
      expect(
        await getFileDownloadUrl(
          row.id,
          StorageDisposition.Attachment,
          restricted(),
        ),
      ).toMatchObject({
        ok: true,
        value: { url: expect.stringContaining("/download") },
      });
      sign.mockRestore();
      const content = await downloadFile(row.id, restricted());
      expect(
        content.ok && (await new Response(content.value.stream).text()),
      ).toBe("brief");
      expect(
        await downloadFile(row.id, f.actor({ permissions: new Set() })),
      ).toMatchObject({ code: E.NotFound });
    });
    it("preserves a row on delete failure and retries with the current version", async () => {
      const { row } = await upload();
      await completeFileUpload(row.id, f.actor());
      expect(
        await deleteFile(
          row.id,
          { version: 2 },
          f.actor({ permissions: new Set([Permission.FilesWrite]) }),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(await deleteFile(row.id, { version: 1 }, f.actor())).toMatchObject(
        { code: ConcurrencyErrorCode.VersionConflict },
      );
      const remove = vi
        .spyOn(memory.adapter, "delete")
        .mockRejectedValueOnce(new StorageError(StorageErrorCode.Unavailable));
      expect(await deleteFile(row.id, { version: 2 }, f.actor())).toMatchObject(
        { code: E.StorageUnavailable },
      );
      remove.mockRestore();
      expect(
        await getFileDownloadUrl(
          row.id,
          StorageDisposition.Attachment,
          f.actor(),
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(await deleteFile(row.id, { version: 3 }, f.actor())).toMatchObject(
        { ok: true },
      );
      expect(await memory.adapter.head(row.storage_key!)).toBeNull();
    });
    it("enforces the pending cap atomically across concurrent ticket requests", async () => {
      await f
        .database()
        .delete(files)
        .where(
          and(
            eq(files.uploaded_by_member_id, f.memberId),
            eq(files.status, FileStatus.Pending),
          ),
        );
      const results = await Promise.all(
        Array.from({ length: MAX_UPLOAD_FILES + 2 }, () =>
          createFileUpload(
            f.customerId,
            { displayName: "x.txt", sizeBytes: 1 },
            f.actor(),
          ),
        ),
      );
      expect(results.filter((result) => result.ok)).toHaveLength(
        MAX_UPLOAD_FILES,
      );
      expect(
        results.filter(
          (result) => !result.ok && result.code === E.PendingLimit,
        ),
      ).toHaveLength(2);
      const ids = results.flatMap((result) =>
        result.ok ? [result.value.file.id] : [],
      );
      await f.database().delete(files).where(inArray(files.id, ids));
    }, 60_000);
  },
);
