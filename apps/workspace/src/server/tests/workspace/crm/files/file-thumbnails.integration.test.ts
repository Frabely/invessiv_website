import { eq } from "drizzle-orm";
import sharp from "sharp";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { files } from "@invessiv/db/record-configuration";
import { StorageError } from "@invessiv/storage";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import { FileThumbnailOutcome } from "@/common/constants/files/file-thumbnail-outcome";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { listPortalFiles } from "@/server/portal/query-handler/list-portal-files.query-handler";
import { fileThumbnailService } from "@/server/shared/files/file-thumbnail-service";
import { storageService } from "@/server/shared/files/storage-service";
import { completeFileUpload } from "@/server/workspace/crm/command-handler/complete-file-upload.command-handler";
import { createFileUpload } from "@/server/workspace/crm/command-handler/create-file-upload.command-handler";
import { deleteFile } from "@/server/workspace/crm/command-handler/delete-file.command-handler";
import { listCustomerFiles } from "@/server/workspace/crm/query-handler/list-customer-files.query-handler";
import { createFileTestFixture } from "../../../shared/files/file-test-fixture";

const scheduled = vi.hoisted(() => [] as (() => Promise<unknown>)[]);
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({
  after: (task: () => Promise<unknown>) => scheduled.push(task),
}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "file thumbnails PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    let memory = createInMemoryStorage();
    beforeAll(async () => {
      await f.setup();
    }, 60_000);
    beforeEach(() => {
      memory = createInMemoryStorage();
      scheduled.length = 0;
      vi.spyOn(storageService, "getAdapter").mockReturnValue(memory.adapter);
    });
    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
    }, 60_000);

    async function completedPhoto(
      name = "Urlaub mit GPS.jpg",
      visibleToCustomer = false,
    ) {
      const bytes = new Uint8Array(
        await sharp({
          create: {
            width: 900,
            height: 600,
            channels: 3,
            background: "#c0ffee",
          },
        })
          .jpeg()
          .toBuffer(),
      );
      const ticket = await createFileUpload(
        f.customerId,
        {
          displayName: name,
          sizeBytes: bytes.length,
          projectId: f.projectId,
          visibleToCustomer,
        },
        f.actor(),
      );
      if (!ticket.ok) throw new Error("Expected upload ticket");
      const [pending] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, ticket.value.file.id));
      memory.seed(pending.storage_key!, bytes, pending.content_type!);
      const completed = await completeFileUpload(pending.id, f.actor());
      if (!completed.ok) throw new Error("Expected completed upload");
      return pending;
    }

    async function reload(id: string) {
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, id));
      return row;
    }

    it("schedules generation after completion and attaches the key without a version bump", async () => {
      const pending = await completedPhoto();
      const ready = await reload(pending.id);
      expect(scheduled).toHaveLength(1);
      expect(ready.thumbnail_key).toBeNull();

      await scheduled[0]();

      const withPreview = await reload(pending.id);
      expect(withPreview.thumbnail_key).toBe(
        `${pending.storage_key}.thumb.webp`,
      );
      expect(withPreview.version).toBe(ready.version);
      expect(withPreview.updated_at).toEqual(ready.updated_at);
      expect(
        await memory.adapter.head(withPreview.thumbnail_key!),
      ).toMatchObject({
        contentType: "image/webp",
      });
      expect(await fileThumbnailService.generate(pending.id)).toBe(
        FileThumbnailOutcome.Skipped,
      );
    });

    it("signs preview URLs only for entries the reader may list", async () => {
      const shared = await completedPhoto("Freigegeben.jpg", true);
      const internal = await completedPhoto("Intern.jpg", false);
      await fileThumbnailService.generate(shared.id);
      await fileThumbnailService.generate(internal.id);
      const portalContact = createPortalActor({
        userId: f.actor().userId,
        membershipId: f.membershipId,
        customerId: f.customerId,
        personId: crypto.randomUUID(),
        firstName: null,
        permissions: new Set([
          Permission.PortalAccess,
          Permission.PortalFilesRead,
        ]),
        projectPermissions: new Map(),
      });

      const crm = await listCustomerFiles(
        f.customerId,
        { page: 1, pageSize: 100 },
        f.actor(),
      );
      const portal = await listPortalFiles(portalContact, {
        page: 1,
        pageSize: 100,
      });

      if (!crm.ok || !portal.ok) throw new Error("Expected both lists");
      const crmPreview = (id: string) =>
        crm.value.files.find((file) => file.id === id)?.thumbnailUrl;
      expect(crmPreview(shared.id)).toMatch(/^https:\/\//);
      expect(crmPreview(internal.id)).toMatch(/^https:\/\//);
      expect(
        portal.value.files.find((file) => file.id === shared.id)?.thumbnailUrl,
      ).toMatch(/^https:\/\//);
      expect(portal.value.files.map((file) => file.id)).not.toContain(
        internal.id,
      );
      expect(JSON.stringify(portal.value)).not.toContain("Intern.jpg.thumb");
    });

    it("keeps the file without preview and logs no file name when storage fails", async () => {
      const pending = await completedPhoto("Geheimer Name.jpg");
      vi.spyOn(memory.adapter, "put").mockRejectedValueOnce(
        new StorageError(StorageErrorCode.Unavailable),
      );
      const log = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await fileThumbnailService.generate(pending.id)).toBe(
        FileThumbnailOutcome.Failed,
      );

      expect((await reload(pending.id)).thumbnail_key).toBeNull();
      expect(log).toHaveBeenCalledWith("[files] thumbnail generation failed", {
        fileId: pending.id,
        code: StorageErrorCode.Unavailable,
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain("Geheimer");
      log.mockRestore();
    });

    it("removes the preview object together with the original", async () => {
      const pending = await completedPhoto();
      await fileThumbnailService.generate(pending.id);
      const row = await reload(pending.id);

      expect(
        await deleteFile(row.id, { version: row.version }, f.actor()),
      ).toMatchObject({ ok: true });

      expect(await memory.adapter.head(row.thumbnail_key!)).toBeNull();
      expect(await memory.adapter.head(row.storage_key!)).toBeNull();
    });

    it("backfills missing previews in batches and finds nothing on a second run", async () => {
      // Earlier cases leave previewless photos whose bytes lived in another in-memory store.
      await f
        .database()
        .delete(files)
        .where(eq(files.customer_id, f.customerId));
      const first = await completedPhoto("Bestand 1.jpg");
      const second = await completedPhoto("Bestand 2.jpg");
      const broken = await completedPhoto("Kaputt.jpg");
      memory.seed(
        broken.storage_key!,
        new TextEncoder().encode("x"),
        "image/jpeg",
      );
      vi.spyOn(console, "error").mockImplementation(() => {});
      const scope = { customerIds: [f.customerId] };

      const run = await fileThumbnailService.backfillMissing(2, scope);

      expect(run).toEqual({ created: 2, skipped: 0, failed: 1 });
      for (const id of [first.id, second.id])
        expect((await reload(id)).thumbnail_key).not.toBeNull();
      expect((await reload(broken.id)).thumbnail_key).toBeNull();
      expect(await fileThumbnailService.backfillMissing(2, scope)).toEqual({
        created: 0,
        skipped: 0,
        failed: 1,
      });
    });

    it("drops a preview whose file disappeared while it was rendered", async () => {
      const pending = await completedPhoto();
      const put = memory.adapter.put.bind(memory.adapter);
      vi.spyOn(memory.adapter, "put").mockImplementationOnce(
        async (key, body, options) => {
          await put(key, body, options);
          await f.database().delete(files).where(eq(files.id, pending.id));
        },
      );

      expect(await fileThumbnailService.generate(pending.id)).toBe(
        FileThumbnailOutcome.Skipped,
      );
      expect(
        await memory.adapter.head(`${pending.storage_key}.thumb.webp`),
      ).toBeNull();
    });
  },
);
