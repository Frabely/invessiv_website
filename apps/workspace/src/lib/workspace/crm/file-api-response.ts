import "server-only";
import type { NextRequest } from "next/server";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { StorageError } from "@invessiv/storage";
import { readJsonBody } from "@/lib/http/read-json-body";

const STATUS_BY_CODE: Partial<Record<E | FileErrorCode, H>> = {
  [E.NotFound]: H.NotFound,
  [E.PendingLimit]: H.TooManyRequests,
  [E.StorageUnavailable]: H.ServiceUnavailable,
  [E.Internal]: H.InternalServerError,
  [FileErrorCode.TooLarge]: H.PayloadTooLarge,
};

const messages: Record<E | FileErrorCode, string> = {
  [E.NotFound]: "File or target not found.",
  [E.Validation]: "Invalid file request.",
  [E.ArchiveLimit]: "Archive file count or size limit exceeded.",
  [E.ArchiveVideo]: "Videos must be downloaded individually.",
  [E.PendingLimit]: "Too many pending uploads.",
  [E.CustomerVisibility]: "Customer uploads must remain visible.",
  [E.UploadOwner]: "Only the uploader can complete this upload.",
  [E.NotUpload]: "This entry is not an upload.",
  [E.StorageUnavailable]: "File storage is temporarily unavailable.",
  [E.Internal]: "The file request failed.",
  [FileErrorCode.UnsupportedExtension]: "Unsupported file extension.",
  [FileErrorCode.InvalidSize]: "Invalid file size.",
  [FileErrorCode.TooLarge]: "File is too large.",
  [FileErrorCode.TooManyFiles]: "Too many files.",
  [FileErrorCode.BatchTooLarge]: "Upload batch is too large.",
  [FileErrorCode.MissingObject]: "Uploaded object not found.",
  [FileErrorCode.SizeMismatch]: "Uploaded size does not match.",
  [FileErrorCode.ContentTypeMismatch]: "Uploaded content type does not match.",
  [FileErrorCode.InvalidSignature]: "Invalid file signature.",
  [FileErrorCode.UnsafeSvg]: "Unsafe SVG content.",
  [FileErrorCode.InvalidOffice]: "Invalid Office document.",
  [FileErrorCode.InvalidLink]: "Invalid HTTPS link.",
};

export function fileApiResponse<T>(
  result: FileResult<T>,
  successStatus: H = H.Ok,
): Response {
  if (result.ok) return Response.json(result.value, { status: successStatus });
  if ("conflict" in result)
    return Response.json(result.conflict, { status: H.Conflict });
  const status = STATUS_BY_CODE[result.code] ?? H.UnprocessableContent;
  return Response.json(
    { code: result.code, message: messages[result.code] },
    { status },
  );
}

/** Wraps authorization too, so denied requests receive the same private caching policy. */
export async function privateFileResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  let response: Response;
  try {
    response = await operation();
  } catch (error) {
    const code =
      error instanceof StorageError ? E.StorageUnavailable : E.Internal;
    // Provider exceptions and SQL details may contain a signed URL or free text.
    console.error("[workspace-files] request failed", { code });
    response = fileApiResponse({ ok: false, code });
  }
  response.headers.set(HttpHeaderName.CacheControl, "private, no-store");
  response.headers.set(HttpHeaderName.XContentTypeOptions, "nosniff");
  return response;
}

export async function parseFileBody<T>(
  request: NextRequest,
  schema: {
    safeParse: (
      body: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  run: (input: T) => Promise<Response>,
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok)
    return Response.json(
      { code: E.Validation, message: messages[E.Validation] },
      { status: H.BadRequest },
    );
  const parsed = schema.safeParse(body.body);
  return parsed.success
    ? run(parsed.data)
    : fileApiResponse({ ok: false, code: E.Validation });
}
