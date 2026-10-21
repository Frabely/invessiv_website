import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { updateFile } from "@/server/workspace/crm/command-handler/update-file.command-handler";

const mocks = vi.hoisted(() => ({
  lock: vi.fn(),
  sign: vi.fn(),
  write: vi.fn(),
  record: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", async (original) => ({
  ...(await original<typeof import("@invessiv/db/core")>()),
  // The mocked services never access the transaction itself.
  getDrizzleDatabaseClient: () => ({
    transaction: (run: (tx: ContactDatabaseTransaction) => unknown) =>
      run({} as ContactDatabaseTransaction),
  }),
}));
vi.mock("@/server/workspace/crm/services/files/file-access-service", () => ({
  fileAccessService: {
    lock: mocks.lock,
    targetExists: vi.fn().mockResolvedValue(true),
  },
}));
vi.mock("@/server/workspace/crm/services/files/file-activity-service", () => ({
  fileActivityService: { recordChanges: mocks.record },
}));
vi.mock("@/server/shared/files/file-thumbnail-service", () => ({
  fileThumbnailService: { signUrl: mocks.sign },
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.write,
}));

const id = "11111111-1111-4111-8111-111111111111";
const customerId = "22222222-2222-4222-8222-222222222222";
const sourceProjectId = "33333333-3333-4333-8333-333333333333";
const destinationProjectId = "44444444-4444-4444-8444-444444444444";
const row: FileRow = {
  id,
  customer_id: customerId,
  project_id: sourceProjectId,
  feedback_round_id: null,
  feedback_item_id: null,
  source: FileSource.Upload,
  status: FileStatus.Ready,
  asset_kind: AssetKind.Image,
  display_name: "photo.jpg",
  note: null,
  visible_to_customer: false,
  uploaded_by_side: UploadSide.Internal,
  uploaded_by_member_id: "member",
  uploaded_by_portal_membership_id: null,
  storage_key: "photo.jpg",
  thumbnail_key: "photo.jpg.thumb.webp",
  content_type: "image/jpeg",
  extension: UploadExtension.Jpg,
  size_bytes: 100,
  inspection_status: FileInspectionStatus.Unscanned,
  url: null,
  orphaned_at: null,
  version: 1,
  created_at: new Date(),
  updated_at: new Date(),
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.lock.mockResolvedValue(row);
  mocks.sign.mockResolvedValue("https://storage.invalid/preview");
  mocks.write.mockImplementation(
    async ({
      patch,
      toDto,
    }: {
      patch: Partial<FileRow>;
      toDto: (current: FileRow) => FileDto;
    }) => ({ ok: true, value: toDto({ ...row, ...patch, version: 2 }) }),
  );
});

describe("updateFile thumbnail read capabilities", () => {
  it("keeps metadata editable without granting a read capability to a write-only actor", async () => {
    expect(
      await updateFile(
        id,
        { version: 1, note: "changed" },
        workspaceActorWith([Permission.FilesWrite]),
      ),
    ).toMatchObject({ ok: true, value: { thumbnailUrl: null } });
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it("preserves the preview for an actor who may read the file", async () => {
    expect(
      await updateFile(
        id,
        { version: 1, note: "changed" },
        workspaceActorWith([Permission.FilesWrite, Permission.FilesRead]),
      ),
    ).toMatchObject({
      ok: true,
      value: { thumbnailUrl: "https://storage.invalid/preview" },
    });
    expect(mocks.sign).toHaveBeenCalledWith(row);
  });

  it("does not sign after moving the file into a scope the actor cannot read", async () => {
    const actor = {
      ...workspaceActorWith([Permission.FilesWrite]),
      projectPermissions: new Map([
        [
          sourceProjectId,
          { customerId, permissions: new Set([Permission.FilesRead]) },
        ],
      ]),
    };
    expect(
      await updateFile(
        id,
        { version: 1, projectId: destinationProjectId },
        actor,
      ),
    ).toMatchObject({
      ok: true,
      value: { thumbnailUrl: null, projectId: destinationProjectId },
    });
    expect(mocks.sign).not.toHaveBeenCalled();
  });

  it("does not borrow destination read permission for an unreadable source", async () => {
    const actor = {
      ...workspaceActorWith([Permission.FilesWrite]),
      projectPermissions: new Map([
        [
          destinationProjectId,
          { customerId, permissions: new Set([Permission.FilesRead]) },
        ],
      ]),
    };
    expect(
      await updateFile(
        id,
        { version: 1, projectId: destinationProjectId },
        actor,
      ),
    ).toMatchObject({ ok: true, value: { thumbnailUrl: null } });
    expect(mocks.sign).not.toHaveBeenCalled();
  });
});
