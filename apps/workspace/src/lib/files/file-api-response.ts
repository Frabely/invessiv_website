import "server-only";
import type { NextRequest } from "next/server";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import type { FileResult } from "@invessiv/common/contracts/files/file-result";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  StorageDisposition,
  type StorageDisposition as StorageDispositionType,
} from "@invessiv/common/constants/storage/storage-options";
import { StorageError } from "@invessiv/storage";
import { readJsonBody } from "@/lib/http/read-json-body";
import type { FileDownload } from "@/server/shared/files/file-object-service-types";
import { fileErrorResponse } from "./file-api-error";

export function fileApiResponse<T>(
  result: FileResult<T>,
  successStatus: H = H.Ok,
): Response {
  if (result.ok) return Response.json(result.value, { status: successStatus });
  if ("conflict" in result)
    return Response.json(result.conflict, { status: H.Conflict });
  return fileErrorResponse(result.code);
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
    console.error("[files] request failed", { code });
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
  if (!body.ok) return fileErrorResponse(E.Validation, H.BadRequest);
  const parsed = schema.safeParse(body.body);
  return parsed.success
    ? run(parsed.data)
    : fileApiResponse({ ok: false, code: E.Validation });
}

/** Streams through the app, so the name is always set; `sandbox` keeps an SVG or HTML-like file inert. */
export function fileDownloadResponse(
  download: FileDownload,
  disposition: StorageDispositionType = StorageDisposition.Attachment,
): Response {
  const encoded = encodeURIComponent(download.filename).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return new Response(download.stream, {
    headers: {
      [HttpHeaderName.ContentType]: download.contentType,
      [HttpHeaderName.ContentDisposition]: `${disposition}; filename="download"; filename*=UTF-8''${encoded}`,
      [HttpHeaderName.ContentSecurityPolicy]: "sandbox",
    },
  });
}

/** The archive is produced while the response is read; it is never buffered on the server. */
export function fileArchiveResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    headers: {
      [HttpHeaderName.ContentType]: MediaType.Zip,
      // The browser saves under the localized dictionary name; this is only the fallback.
      [HttpHeaderName.ContentDisposition]: 'attachment; filename="dateien.zip"',
    },
  });
}
