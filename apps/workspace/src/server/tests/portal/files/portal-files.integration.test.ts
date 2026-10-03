import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import {
  MAX_UPLOAD_FILES,
  UPLOAD_URL_TTL_MS,
} from "@invessiv/common/constants/files/upload-limits";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { StorageDisposition } from "@invessiv/common/constants/storage/storage-options";
import { activities, files, projects } from "@invessiv/db/record-configuration";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { completePortalFileUpload } from "@/server/portal/command-handler/complete-portal-file-upload.command-handler";
import { cancelPortalFileUpload } from "@/server/portal/command-handler/cancel-portal-file-upload.command-handler";
import { createPortalFileLink } from "@/server/portal/command-handler/create-portal-file-link.command-handler";
import { createPortalFileUpload } from "@/server/portal/command-handler/create-portal-file-upload.command-handler";
import { createPortalFilesArchive } from "@/server/portal/query-handler/create-portal-files-archive.query-handler";
import { downloadPortalFile } from "@/server/portal/query-handler/download-portal-file.query-handler";
import { getPortalFileDownloadUrl } from "@/server/portal/query-handler/get-portal-file-download-url.query-handler";
import { listPortalFileProjects } from "@/server/portal/query-handler/list-portal-file-projects.query-handler";
import { listPortalFiles } from "@/server/portal/query-handler/list-portal-files.query-handler";
import { storageService } from "@/server/shared/files/storage-service";
import { createFileLink } from "@/server/workspace/crm/command-handler/create-file-link.command-handler";
import { completeFileUpload } from "@/server/workspace/crm/command-handler/complete-file-upload.command-handler";
import { createFileUpload } from "@/server/workspace/crm/command-handler/create-file-upload.command-handler";
import { listCustomerFiles } from "@/server/workspace/crm/query-handler/list-customer-files.query-handler";
import { createFileTestFixture } from "../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal files PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const memory = createInMemoryStorage();
    const archivedProjectId = crypto.randomUUID();
    const secondProjectId = crypto.randomUUID();

    function contact(
      permissions: Permission[] = [
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
        Permission.PortalFilesRead,
        Permission.PortalFilesWrite,
      ],
      customerId = f.customerId,
    ) {
      return createPortalActor({
        userId: f.actor().userId,
        membershipId: f.membershipId,
        customerId,
        personId: crypto.randomUUID(),
        firstName: null,
        permissions: new Set(permissions),
        projectPermissions: new Map(),
      });
    }

    function owner() {
      return createPortalOwnerView({
        userId: f.actor().userId,
        customerId: f.customerId,
        permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
      });
    }

    async function internalLink(
      overrides: Partial<{
        visibleToCustomer: boolean;
        projectId: string | null;
        displayName: string;
      }> = {},
    ) {
      const created = await createFileLink(
        f.customerId,
        {
          displayName: "Draft",
          url: "https://example.com/draft",
          projectId: f.projectId,
          visibleToCustomer: true,
          ...overrides,
        },
        f.actor(),
      );
      if (!created.ok) throw new Error("Expected internal link fixture");
      return created.value.id;
    }

    async function internalUpload(visibleToCustomer: boolean) {
      const bytes = new TextEncoder().encode("brief");
      const ticket = await createFileUpload(
        f.customerId,
        {
          displayName: "brief.txt",
          sizeBytes: bytes.length,
          projectId: f.projectId,
          visibleToCustomer,
        },
        f.actor(),
      );
      if (!ticket.ok) throw new Error("Expected upload ticket");
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, ticket.value.file.id));
      memory.seed(row.storage_key!, bytes, row.content_type!);
      return row;
    }

    async function customerUpload(name = "logo.txt", content = "logo") {
      const bytes = new TextEncoder().encode(content);
      const ticket = await createPortalFileUpload(contact(), {
        displayName: name,
        sizeBytes: bytes.length,
      });
      if (!ticket.ok) throw new Error("Expected portal upload ticket");
      const [row] = await f
        .database()
        .select()
        .from(files)
        .where(eq(files.id, ticket.value.file.id));
      memory.seed(row.storage_key!, bytes, row.content_type!);
      return row;
    }

    const ids = (
      result: Awaited<ReturnType<typeof listPortalFiles>>,
    ): string[] => (result.ok ? result.value.files.map((file) => file.id) : []);

    beforeAll(async () => {
      await f.setup();
      await f
        .database()
        .insert(projects)
        .values({
          id: archivedProjectId,
          customer_id: f.customerId,
          title: "archived",
          owner_member_id: f.memberId,
          status: ProjectStatus.Archived,
          phase: ProjectPhase.Onboarding,
          process_steps: [ProjectPhase.Onboarding],
          current_process_step: ProjectPhase.Onboarding,
          workflow_key: ProjectWorkflowKey.StandardWebV1,
          billing_model: ProjectBillingModel.FixedPrice,
          included_feedback_rounds: 2,
          version: 1,
        });
      await f
        .database()
        .insert(projects)
        .values({
          id: secondProjectId,
          customer_id: f.customerId,
          title: "second project",
          owner_member_id: f.memberId,
          status: ProjectStatus.Active,
          phase: ProjectPhase.Onboarding,
          process_steps: [ProjectPhase.Onboarding],
          current_process_step: ProjectPhase.Onboarding,
          workflow_key: ProjectWorkflowKey.StandardWebV1,
          billing_model: ProjectBillingModel.FixedPrice,
          included_feedback_rounds: 2,
          version: 1,
        });
      vi.spyOn(storageService, "getAdapter").mockReturnValue(memory.adapter);
    }, 60_000);

    afterAll(async () => {
      vi.restoreAllMocks();
      await f.cleanup();
    }, 60_000);

    it("lists only released, ready entries of visible projects in the from-us tab", async () => {
      const shared = await internalLink();
      const internal = await internalLink({ visibleToCustomer: false });
      const archived = await internalLink({ projectId: archivedProjectId });
      const companyWide = await internalLink({ projectId: null });
      const pending = await internalUpload(true);

      const result = await listPortalFiles(contact(), {
        origin: PortalFileOrigin.FromUs,
      });
      expect(ids(result)).toEqual(
        expect.arrayContaining([shared, companyWide]),
      );
      expect(ids(result)).not.toContain(internal);
      expect(ids(result)).not.toContain(archived);
      expect(ids(result)).not.toContain(pending.id);
      expect(JSON.stringify(result)).not.toContain(f.memberId);
      expect(
        ids(
          await listPortalFiles(contact(), {
            origin: PortalFileOrigin.FromYou,
          }),
        ),
      ).not.toContain(shared);
    });

    it("limits a project view to its files and company-wide files", async () => {
      const own = await internalLink({ displayName: "project-selected" });
      const general = await internalLink({
        displayName: "company-wide",
        projectId: null,
      });
      const other = await internalLink({
        displayName: "other-project",
        projectId: secondProjectId,
      });
      const selected = await listPortalFiles(contact(), {
        projectId: f.projectId,
      });
      expect(ids(selected)).toContain(own);
      expect(ids(selected)).toContain(general);
      expect(ids(selected)).not.toContain(other);
      expect(
        await listPortalFiles(contact(), { projectId: f.foreignProjectId }),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await listPortalFiles(contact(), { projectId: crypto.randomUUID() }),
      ).toMatchObject({ code: E.NotFound });
    });

    it("shows project titles only with portal.projects.read", async () => {
      await internalLink({ displayName: "titled" });
      const withProjects = await listPortalFiles(contact(), {
        origin: PortalFileOrigin.FromUs,
      });
      const titled = withProjects.ok
        ? withProjects.value.files.find((file) => file.displayName === "titled")
        : undefined;
      expect(titled?.projectTitle).toContain(f.projectId);

      const withoutProjects = await listPortalFiles(
        contact([Permission.PortalAccess, Permission.PortalFilesRead]),
        { origin: PortalFileOrigin.FromUs },
      );
      expect(
        withoutProjects.ok &&
          withoutProjects.value.files.every(
            (file) => file.projectTitle === null,
          ),
      ).toBe(true);
    });

    it("answers not found for foreign customers and missing permissions", async () => {
      expect(
        await listPortalFiles(contact([Permission.PortalAccess]), {
          origin: PortalFileOrigin.FromUs,
        }),
      ).toMatchObject({ code: E.NotFound });
      const foreign = await createFileLink(
        f.foreignCustomerId,
        {
          displayName: "foreign",
          url: "https://example.com/foreign",
          projectId: f.foreignProjectId,
          visibleToCustomer: true,
        },
        f.actor(),
      );
      if (!foreign.ok) throw new Error("Expected foreign link");
      expect(
        ids(
          await listPortalFiles(contact(), { origin: PortalFileOrigin.FromUs }),
        ),
      ).not.toContain(foreign.value.id);
      expect(
        await createPortalFilesArchive(contact(), [foreign.value.id]),
      ).toMatchObject({ code: E.NotFound });
    });

    it("never signs internal, pending or guessed ids", async () => {
      const hidden = await internalUpload(false);
      await completeFileUpload(hidden.id, f.actor());
      const pending = await internalUpload(true);
      for (const id of [hidden.id, pending.id, crypto.randomUUID(), "x"]) {
        expect(
          await getPortalFileDownloadUrl(
            contact(),
            id,
            StorageDisposition.Attachment,
          ),
        ).toMatchObject({ code: E.NotFound });
        expect(await downloadPortalFile(contact(), id)).toMatchObject({
          code: E.NotFound,
        });
      }
      expect(
        await createPortalFilesArchive(contact(), [hidden.id]),
      ).toMatchObject({ code: E.NotFound });
    });

    it("lets contacts and the owner view read a released upload", async () => {
      const released = await internalUpload(true);
      await completeFileUpload(released.id, f.actor());
      for (const reader of [contact(), owner()]) {
        expect(
          await getPortalFileDownloadUrl(
            reader,
            released.id,
            StorageDisposition.Inline,
          ),
        ).toMatchObject({ ok: true });
        const download = await downloadPortalFile(reader, released.id);
        expect(
          download.ok && (await new Response(download.value.stream).text()),
        ).toBe("brief");
        expect(
          await createPortalFilesArchive(reader, [released.id]),
        ).toMatchObject({ ok: true });
      }
    });

    it("stores customer uploads as visible, own and completed once", async () => {
      const row = await customerUpload();
      expect(row).toMatchObject({
        status: FileStatus.Pending,
        visible_to_customer: true,
        uploaded_by_side: UploadSide.Customer,
        uploaded_by_portal_membership_id: f.membershipId,
        uploaded_by_member_id: null,
      });

      const results = await Promise.all([
        completePortalFileUpload(contact(), row.id),
        completePortalFileUpload(contact(), row.id),
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
      const own = events.filter((event) => event.metadata?.file_id === row.id);
      expect(own).toHaveLength(1);
      expect(own[0]).toMatchObject({ actor_type: ActorType.Customer });
      expect(JSON.stringify(own)).not.toContain("logo.txt");

      expect(
        ids(
          await listPortalFiles(contact(), {
            origin: PortalFileOrigin.FromYou,
          }),
        ),
      ).toContain(row.id);
      const internal = await listCustomerFiles(
        f.customerId,
        { origin: "customer" },
        f.actor(),
      );
      expect(
        internal.ok && internal.value.files.some((file) => file.id === row.id),
      ).toBe(true);
    });

    it("lets only the uploading membership complete and refuses the wrong content", async () => {
      const row = await customerUpload();
      const stranger = createPortalActor({
        ...contact(),
        membershipId: crypto.randomUUID(),
      });
      expect(await completePortalFileUpload(stranger, row.id)).toMatchObject({
        code: E.NotFound,
      });
      expect(
        await completePortalFileUpload(
          contact([Permission.PortalFilesRead]),
          row.id,
        ),
      ).toMatchObject({ code: E.NotFound });

      const fake = await customerUpload("logo.png", "<html>not a png</html>");
      expect(await completePortalFileUpload(contact(), fake.id)).toMatchObject({
        ok: false,
      });
      expect(await memory.adapter.head(fake.storage_key!)).toBeNull();
    });

    it("lets only the uploader cancel a pending upload and never cancels a ready file", async () => {
      const untransferred = await createPortalFileUpload(contact(), {
        displayName: "never-sent.txt",
        sizeBytes: 4,
      });
      if (!untransferred.ok)
        throw new Error("Expected an unused upload ticket");
      expect(
        await cancelPortalFileUpload(contact(), untransferred.value.file.id),
      ).toMatchObject({ ok: true, value: { cancelled: true } });

      const pending = await customerUpload("cancel.txt");
      const stranger = createPortalActor({
        ...contact(),
        membershipId: crypto.randomUUID(),
      });
      expect(await cancelPortalFileUpload(stranger, pending.id)).toMatchObject({
        code: E.NotFound,
      });
      expect(await cancelPortalFileUpload(contact(), pending.id)).toMatchObject(
        {
          ok: true,
          value: { cancelled: true },
        },
      );
      expect(await memory.adapter.head(pending.storage_key!)).toBeNull();
      expect(await cancelPortalFileUpload(contact(), pending.id)).toMatchObject(
        {
          code: E.NotFound,
        },
      );

      const ready = await customerUpload("ready.txt");
      expect(await completePortalFileUpload(contact(), ready.id)).toMatchObject(
        { ok: true },
      );
      expect(await cancelPortalFileUpload(contact(), ready.id)).toMatchObject({
        code: E.NotFound,
      });
    });

    it("accepts only visible projects as targets and never fetches a link", async () => {
      const fetch = vi.spyOn(globalThis, "fetch");
      const link = {
        displayName: "Brand film",
        url: "https://drive.google.com/file/1",
      };
      expect(
        await createPortalFileLink(contact(), {
          ...link,
          projectId: f.projectId,
        }),
      ).toMatchObject({
        ok: true,
        value: { origin: PortalFileOrigin.FromYou },
      });
      for (const projectId of [archivedProjectId, f.foreignProjectId]) {
        expect(
          await createPortalFileLink(contact(), { ...link, projectId }),
        ).toMatchObject({ code: E.NotFound });
        expect(
          await createPortalFileUpload(contact(), {
            displayName: "x.txt",
            sizeBytes: 1,
            projectId,
          }),
        ).toMatchObject({ code: E.NotFound });
      }
      expect(
        await createPortalFileLink(
          contact([Permission.PortalAccess, Permission.PortalFilesWrite]),
          { ...link, projectId: f.projectId },
        ),
      ).toMatchObject({ code: E.NotFound });
      expect(
        await createPortalFileLink(contact([Permission.PortalFilesRead]), link),
      ).toMatchObject({ code: E.NotFound });
      expect(fetch).not.toHaveBeenCalled();
      fetch.mockRestore();

      const options = await listPortalFileProjects(contact());
      expect(options.map((option) => option.id)).toContain(f.projectId);
      expect(options.map((option) => option.id)).not.toContain(
        archivedProjectId,
      );
    });

    it("enforces the pending cap per membership across parallel requests", async () => {
      await f
        .database()
        .delete(files)
        .where(
          and(
            eq(files.uploaded_by_portal_membership_id, f.membershipId),
            eq(files.status, FileStatus.Pending),
          ),
        );
      const results = await Promise.all(
        Array.from({ length: MAX_UPLOAD_FILES + 2 }, () =>
          createPortalFileUpload(contact(), {
            displayName: "x.txt",
            sizeBytes: 1,
          }),
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
    }, 60_000);

    it("frees the slots of pending uploads whose ticket has expired", async () => {
      const blocked = await createPortalFileUpload(contact(), {
        displayName: "x.txt",
        sizeBytes: 1,
      });
      expect(blocked).toMatchObject({ code: E.PendingLimit });

      await f
        .database()
        .update(files)
        .set({ created_at: new Date(Date.now() - UPLOAD_URL_TTL_MS - 1_000) })
        .where(
          and(
            eq(files.uploaded_by_portal_membership_id, f.membershipId),
            eq(files.status, FileStatus.Pending),
          ),
        );
      expect(
        await createPortalFileUpload(contact(), {
          displayName: "x.txt",
          sizeBytes: 1,
        }),
      ).toMatchObject({ ok: true });
    }, 60_000);
  },
);
