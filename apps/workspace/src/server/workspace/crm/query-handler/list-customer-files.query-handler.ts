import "server-only";
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileOrigin } from "@invessiv/common/constants/files/file-origin";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileListQueryDto } from "@invessiv/common/contracts/files/file-list-query.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { customerFileVisibilityService } from "@/server/shared/files/customer-file-visibility-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { fileSchemas } from "../services/files/file-schemas";
import { fileAccessService } from "../services/files/file-access-service";
import { fileMappingService } from "../services/files/file-mapping-service";

const LIKE_WILDCARD_PATTERN = /[\\%_]/g;

export async function listCustomerFiles(
  customerId: string,
  input: FileListQueryDto,
  actor: WorkspaceActor,
): Promise<
  FileResult<{
    files: FileDto[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  if (!fileSchemas.id.safeParse(customerId).success)
    return { ok: false, code: E.NotFound };
  const parsed = fileSchemas.list.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  const db = getDrizzleDatabaseClient();
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        crmAccessCondition.forScope(accessScope(actor, Permission.FilesRead), {
          customerId: customers.id,
        }),
      ),
    )
    .limit(1);
  if (!customer) return { ok: false, code: E.NotFound };
  if (
    data.projectId !== undefined &&
    !(await db.transaction((tx) =>
      fileAccessService.targetExists(
        tx,
        customerId,
        data.projectId ?? null,
        actor,
        Permission.FilesRead,
      ),
    ))
  ) {
    return { ok: false, code: E.NotFound };
  }
  const search = data.search
    ? `%${data.search.replace(LIKE_WILDCARD_PATTERN, "\\$&")}%`
    : undefined;
  const projectCondition =
    data.projectId === undefined
      ? undefined
      : data.projectId === null
        ? isNull(files.project_id)
        : eq(files.project_id, data.projectId);
  const originCondition =
    data.origin === FileOrigin.Customer
      ? eq(files.uploaded_by_side, UploadSide.Customer)
      : data.origin === FileOrigin.Shared
        ? and(
            eq(files.uploaded_by_side, UploadSide.Internal),
            eq(files.visible_to_customer, true),
          )
        : data.origin === FileOrigin.Internal
          ? and(
              eq(files.uploaded_by_side, UploadSide.Internal),
              eq(files.visible_to_customer, false),
            )
          : undefined;
  const searchCondition = search
    ? or(ilike(files.display_name, search), ilike(files.note, search))
    : undefined;
  const condition = and(
    fileAccessService.readableCondition(actor),
    eq(files.customer_id, customerId),
    data.shareable
      ? customerFileVisibilityService.openableCondition(customerId)
      : undefined,
    projectCondition,
    data.assetKind ? eq(files.asset_kind, data.assetKind) : undefined,
    originCondition,
    searchCondition,
  );
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(files)
      .where(condition)
      .orderBy(desc(files.created_at), desc(files.id))
      .limit(data.pageSize)
      .offset((data.page - 1) * data.pageSize),
    db.select({ value: count() }).from(files).where(condition),
  ]);
  return {
    ok: true,
    value: {
      files: rows.map(fileMappingService.toDto),
      total: total.value,
      page: data.page,
      pageSize: data.pageSize,
    },
  };
}
