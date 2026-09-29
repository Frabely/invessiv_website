import "server-only";
import { and, eq, isNull, type SQL } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  files,
  portalMemberships,
  projects,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { customerFileVisibilityService } from "@/server/shared/files/customer-file-visibility-service";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { portalFileSchemas } from "./portal-file-schemas";

/**
 * The single definition of "the customer may see this entry": released and openable (finished, not
 * orphaned, company-wide or in a project the portal shows). Archived and cancelled projects keep
 * their files internal, also for guessed ids.
 */
function visibleCondition(reader: PortalReader): SQL {
  return and(
    portalAccessCondition.forReader(reader, Permission.PortalFilesRead, {
      customerId: files.customer_id,
    }),
    eq(files.visible_to_customer, true),
    customerFileVisibilityService.openableCondition(reader.customerId),
  )!;
}

function originCondition(origin: PortalFileOrigin): SQL {
  return eq(
    files.uploaded_by_side,
    origin === PortalFileOrigin.FromYou
      ? UploadSide.Customer
      : UploadSide.Internal,
  );
}

function canSeeProjects(reader: PortalReader): boolean {
  return portalCanOn.forReader(reader, Permission.PortalProjectsRead, {
    customerId: reader.customerId,
  });
}

function canWrite(actor: PortalActor): boolean {
  return portalCanOn.forActor(actor, Permission.PortalFilesWrite, {
    customerId: actor.customerId,
  });
}

async function findVisibleUpload(
  reader: PortalReader,
  id: string,
): Promise<FileRow | null> {
  if (!portalFileSchemas.id.safeParse(id).success) return null;
  const [row] = await getDrizzleDatabaseClient()
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, id),
        eq(files.source, FileSource.Upload),
        visibleCondition(reader),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** "General" needs no check; a project must be one the contact may see in the portal. */
async function targetExists(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  projectId: string | null,
): Promise<boolean> {
  if (!projectId) return true;
  if (!canSeeProjects(actor)) return false;
  const [row] = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        portalProjectCondition(actor, Permission.PortalProjectsRead),
      ),
    )
    .limit(1)
    .for("share");
  return !!row;
}

/** Serializes ticket issuance per membership, so parallel requests cannot pass the pending limit. */
async function lockMembership(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: portalMemberships.id })
    .from(portalMemberships)
    .where(
      and(
        eq(portalMemberships.id, actor.membershipId),
        eq(portalMemberships.customer_id, actor.customerId),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .for("update");
  return !!row;
}

/** Only the membership that started an upload may finish it; anything else looks absent. */
async function lockOwnUpload(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  id: string,
): Promise<FileRow | null> {
  if (!portalFileSchemas.id.safeParse(id).success) return null;
  const [row] = await tx
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, id),
        eq(files.customer_id, actor.customerId),
        eq(files.uploaded_by_portal_membership_id, actor.membershipId),
        eq(files.source, FileSource.Upload),
        isNull(files.orphaned_at),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}

/**
 * Any entry of the company that the contact may see, not only own uploads; a hidden internal entry
 * answers like a missing one. The caller decides what the entry may be used for.
 */
async function lockVisible(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  id: string,
): Promise<FileRow | null> {
  if (!portalFileSchemas.id.safeParse(id).success) return null;
  const [row] = await tx
    .select()
    .from(files)
    .where(
      and(
        eq(files.id, id),
        eq(files.customer_id, actor.customerId),
        eq(files.visible_to_customer, true),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}

export const portalFileService = {
  visibleCondition,
  originCondition,
  canSeeProjects,
  canWrite,
  findVisibleUpload,
  targetExists,
  lockMembership,
  lockOwnUpload,
  lockVisible,
};
