import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { StorageErrorCode } from "@invessiv/common/constants/storage/storage-error-code";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { authenticateWorkspaceRequest } from "@/lib/auth/workspace-authentication";
import { createFileLink } from "@/server/workspace/crm/command-handler/create-file-link.command-handler";
import { updateFile } from "@/server/workspace/crm/command-handler/update-file.command-handler";
import { downloadFile } from "@/server/workspace/crm/query-handler/download-file.query-handler";
import { StorageError } from "@invessiv/storage";
import { GET as list } from "@/app/api/workspace/crm/customers/[id]/files/route";
import { POST as archive } from "@/app/api/workspace/crm/customers/[id]/files/archive/route";
import { POST as upload } from "@/app/api/workspace/crm/customers/[id]/files/uploads/route";
import { POST as link } from "@/app/api/workspace/crm/customers/[id]/files/links/route";
import { POST as complete } from "@/app/api/workspace/crm/files/[fileId]/complete/route";
import { DELETE, PATCH } from "@/app/api/workspace/crm/files/[fileId]/route";
import { GET as downloadUrl } from "@/app/api/workspace/crm/files/[fileId]/download-url/route";
import { GET as download } from "@/app/api/workspace/crm/files/[fileId]/download/route";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: vi.fn(),
}));
vi.mock(
  "@/server/workspace/crm/command-handler/create-file-link.command-handler",
  () => ({ createFileLink: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-file.command-handler",
  () => ({ updateFile: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/download-file.query-handler",
  () => ({ downloadFile: vi.fn() }),
);

const id = "10101010-1010-4010-8010-101010101010";
const context = { params: Promise.resolve({ id, fileId: id }) };
const routes = [
  [list, HttpMethod.Get],
  [archive, HttpMethod.Post],
  [upload, HttpMethod.Post],
  [link, HttpMethod.Post],
  [complete, HttpMethod.Post],
  [PATCH, HttpMethod.Patch],
  [DELETE, HttpMethod.Delete],
  [downloadUrl, HttpMethod.Get],
  [download, HttpMethod.Get],
] as const;

function authorize(permissions: Permission[]) {
  vi.mocked(authenticateWorkspaceRequest).mockResolvedValue({
    status: WorkspaceAuthStatus.Authorized,
    actor: {
      userId: id,
      workspaceMemberId: id,
      permissions: new Set(permissions),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
    },
  });
}

function request(method: HttpMethod, body?: object) {
  return new NextRequest(
    `http://localhost${WorkspaceApiEndpoint.CrmFiles}/${id}`,
    {
      method,
      ...(body
        ? {
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
            body: JSON.stringify(body),
          }
        : {}),
    },
  );
}

beforeEach(() => vi.resetAllMocks());
describe("file HTTP authorization and responses", () => {
  it.each(routes)(
    "requires a workspace session for every endpoint",
    async (route, method) => {
      vi.mocked(authenticateWorkspaceRequest).mockResolvedValue({
        status: WorkspaceAuthStatus.Unauthenticated,
      });
      const response = await route(request(method), context);
      expect(response.status).toBe(H.Unauthorized);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        "private, no-store",
      );
    },
  );
  it.each(routes)(
    "requires the endpoint permission before parsing or accessing storage",
    async (route, method) => {
      authorize([]);
      expect((await route(request(method), context)).status).toBe(H.Forbidden);
    },
  );
  it("rejects mass assignment, missing versions and malformed JSON", async () => {
    authorize([Permission.FilesWrite]);
    expect(
      (
        await link(
          request(HttpMethod.Post, {
            displayName: "Link",
            url: "https://example.com",
            uploadedBySide: "customer",
          }),
          context,
        )
      ).status,
    ).toBe(H.UnprocessableContent);
    expect(vi.mocked(createFileLink)).not.toHaveBeenCalled();
    expect(
      (await PATCH(request(HttpMethod.Patch, { note: "no version" }), context))
        .status,
    ).toBe(H.UnprocessableContent);
    expect((await link(request(HttpMethod.Post), context)).status).toBe(
      H.BadRequest,
    );
  });
  it("rejects duplicate and malformed archive selections before reading files", async () => {
    authorize([Permission.FilesRead]);
    const duplicate = await archive(
      request(HttpMethod.Post, { fileIds: [id, id] }),
      context,
    );
    expect(duplicate.status).toBe(H.UnprocessableContent);
    const invalid = await archive(
      request(HttpMethod.Post, { fileIds: ["invalid"] }),
      context,
    );
    expect(invalid.status).toBe(H.UnprocessableContent);
    expect(duplicate.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
  });
  it("maps a missing resource and version conflicts without changing their contract", async () => {
    authorize([Permission.FilesWrite]);
    vi.mocked(createFileLink).mockResolvedValue({
      ok: false,
      code: FileApiErrorCode.NotFound,
    });
    expect(
      (
        await link(
          request(HttpMethod.Post, {
            displayName: "Link",
            url: "https://example.com",
          }),
          context,
        )
      ).status,
    ).toBe(H.NotFound);
    vi.mocked(updateFile).mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 2,
        current: null!,
      },
    });
    const response = await PATCH(
      request(HttpMethod.Patch, { version: 1, note: "test" }),
      context,
    );
    expect(response.status).toBe(H.Conflict);
    expect(await response.json()).toMatchObject({
      currentVersion: 2,
      code: ConcurrencyErrorCode.VersionConflict,
    });
  });
  it("streams a sandboxed attachment with a safely encoded UTF-8 filename", async () => {
    authorize([Permission.FilesRead]);
    vi.mocked(downloadFile).mockResolvedValue({
      ok: true,
      value: {
        filename: "Übersicht.svg",
        contentType: "image/svg+xml",
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("<svg/>"));
            controller.close();
          },
        }),
      },
    });
    const response = await download(request(HttpMethod.Get), context);
    expect(response.headers.get(HttpHeaderName.ContentSecurityPolicy)).toBe(
      "sandbox",
    );
    expect(response.headers.get(HttpHeaderName.ContentDisposition)).toContain(
      "attachment;",
    );
    expect(response.headers.get(HttpHeaderName.ContentDisposition)).toContain(
      "%C3%9Cbersicht.svg",
    );
    expect(response.headers.get(HttpHeaderName.XContentTypeOptions)).toBe(
      "nosniff",
    );
    expect(await response.text()).toBe("<svg/>");
  });
  it("redacts provider errors from responses and logs", async () => {
    authorize([Permission.FilesRead]);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(downloadFile).mockRejectedValue(
      new StorageError(StorageErrorCode.Unavailable),
    );
    const response = await download(request(HttpMethod.Get), context);
    expect(response.status).toBe(H.ServiceUnavailable);
    expect(await response.json()).toMatchObject({
      code: FileApiErrorCode.StorageUnavailable,
    });
    expect(log).toHaveBeenCalledWith("[workspace-files] request failed", {
      code: FileApiErrorCode.StorageUnavailable,
    });
    log.mockRestore();
  });
});
