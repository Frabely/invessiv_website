import "server-only";

import type { NextRequest } from "next/server";

import { LeadImportErrorCode } from "@/common/constants/leads/lead-import-error-codes";
import { withWorkspaceApiAuth } from "@/lib/auth/api";
import { leadImportApiError } from "@/lib/workspace/leads/lead-import-api-error";
import { importLeads } from "@/server/workspace/leads/command-handler/import-leads.command-handler";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["text/csv", "application/vnd.ms-excel"]);

export const POST = withWorkspaceApiAuth(async (request: NextRequest) => {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > MAX_FILE_BYTES) {
    return leadImportApiError(LeadImportErrorCode.FileTooLarge, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return leadImportApiError(LeadImportErrorCode.EmptyFile, 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return leadImportApiError(LeadImportErrorCode.EmptyFile, 400);
  }

  if (file.size > MAX_FILE_BYTES) {
    return leadImportApiError(LeadImportErrorCode.FileTooLarge, 413);
  }

  const isValidMime =
    ACCEPTED_MIME_TYPES.has(file.type) || file.name.endsWith(".csv");
  if (!isValidMime) {
    return leadImportApiError(LeadImportErrorCode.UnsupportedMediaType, 415);
  }

  const result = await importLeads(file);

  if (!result.ok) {
    return leadImportApiError(result.error, 422);
  }

  return Response.json({ report: result.report }, { status: 200 });
});
