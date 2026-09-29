import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { PortalFileListPageDto } from "@invessiv/common/contracts/portal/portal-file-list-page.dto";
import type { PortalFileListQueryDto } from "@invessiv/common/contracts/portal/portal-file-list-query.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files, projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalFileMappingService } from "@/server/portal/services/files/portal-file-mapping-service";
import { portalFileSchemas } from "@/server/portal/services/files/portal-file-schemas";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";

/** One tab of visible entries, newest first; without `portal.files.read` the page does not exist. */
export async function listPortalFiles(
  reader: PortalReader,
  input: PortalFileListQueryDto,
): Promise<FileResult<PortalFileListPageDto>> {
  if (
    !portalCanOn.forReader(reader, Permission.PortalFilesRead, {
      customerId: reader.customerId,
    })
  )
    return { ok: false, code: E.NotFound };
  const parsed = portalFileSchemas.list.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const { origin, page, pageSize } = parsed.data;
  const db = getDrizzleDatabaseClient();
  const condition = and(
    portalFileService.visibleCondition(reader),
    portalFileService.originCondition(origin),
  );
  const [rows, [total]] = await Promise.all([
    db
      .select({ file: files, projectTitle: projects.title })
      .from(files)
      .leftJoin(projects, eq(projects.id, files.project_id))
      .where(condition)
      .orderBy(desc(files.created_at), desc(files.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(files).where(condition),
  ]);
  const withProjects = portalFileService.canSeeProjects(reader);
  return {
    ok: true,
    value: {
      files: rows.map((row) =>
        portalFileMappingService.toDto(
          row.file,
          withProjects ? row.projectTitle : null,
        ),
      ),
      total: total.value,
      page,
      pageSize,
    },
  };
}
