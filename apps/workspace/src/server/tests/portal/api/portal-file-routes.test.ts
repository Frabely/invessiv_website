import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { GET as list } from "@/app/api/portal/[customerId]/files/route";
import { POST as archive } from "@/app/api/portal/[customerId]/files/archive/route";
import { POST as link } from "@/app/api/portal/[customerId]/files/links/route";
import { POST as upload } from "@/app/api/portal/[customerId]/files/uploads/route";
import { POST as complete } from "@/app/api/portal/[customerId]/files/[fileId]/complete/route";
import { POST as cancel } from "@/app/api/portal/[customerId]/files/[fileId]/cancel/route";
import { GET as download } from "@/app/api/portal/[customerId]/files/[fileId]/download/route";
import { GET as downloadUrl } from "@/app/api/portal/[customerId]/files/[fileId]/download-url/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authenticateReader: vi.fn(),
  listPortalFiles: vi.fn(),
  createPortalFileLink: vi.fn(),
  createPortalFileUpload: vi.fn(),
  completePortalFileUpload: vi.fn(),
  cancelPortalFileUpload: vi.fn(),
  getPortalFileDownloadUrl: vi.fn(),
  downloadPortalFile: vi.fn(),
  createPortalFilesArchive: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
    authenticateReader: mocks.authenticateReader,
  },
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-files.query-handler",
  () => ({ listPortalFiles: mocks.listPortalFiles }),
);
vi.mock(
  "@/server/portal/command-handler/create-portal-file-link.command-handler",
  () => ({ createPortalFileLink: mocks.createPortalFileLink }),
);
vi.mock(
  "@/server/portal/command-handler/create-portal-file-upload.command-handler",
  () => ({ createPortalFileUpload: mocks.createPortalFileUpload }),
);
vi.mock(
  "@/server/portal/command-handler/complete-portal-file-upload.command-handler",
  () => ({ completePortalFileUpload: mocks.completePortalFileUpload }),
);
vi.mock(
  "@/server/portal/command-handler/cancel-portal-file-upload.command-handler",
  () => ({ cancelPortalFileUpload: mocks.cancelPortalFileUpload }),
);
vi.mock(
  "@/server/portal/query-handler/get-portal-file-download-url.query-handler",
  () => ({ getPortalFileDownloadUrl: mocks.getPortalFileDownloadUrl }),
);
vi.mock(
  "@/server/portal/query-handler/download-portal-file.query-handler",
  () => ({ downloadPortalFile: mocks.downloadPortalFile }),
);
vi.mock(
  "@/server/portal/query-handler/create-portal-files-archive.query-handler",
  () => ({ createPortalFilesArchive: mocks.createPortalFilesArchive }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FILE_ID = "22222222-2222-4222-8222-222222222222";
const context = {
  params: Promise.resolve({ customerId: CUSTOMER_ID, fileId: FILE_ID }),
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalFilesRead,
    Permission.PortalFilesWrite,
  ]),
  projectPermissions: new Map(),
});

const readRoutes = [
  [list, HttpMethod.Get],
  [downloadUrl, HttpMethod.Get],
  [download, HttpMethod.Get],
  [archive, HttpMethod.Post],
] as const;
const writeRoutes = [
  [upload, HttpMethod.Post],
  [link, HttpMethod.Post],
  [complete, HttpMethod.Post],
  [cancel, HttpMethod.Post],
] as const;

function request(method: HttpMethod, body?: object, search = "") {
  return new NextRequest(
    `http://localhost/api/portal/${CUSTOMER_ID}/files${search}`,
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticateRequest.mockResolvedValue({
    status: PortalAuthStatus.Authorized,
    actor: ACTOR,
  });
  mocks.authenticateReader.mockResolvedValue({
    status: PortalAuthStatus.Authorized,
    reader: ACTOR,
  });
});

describe("portal file routes", () => {
  it.each([...readRoutes, ...writeRoutes])(
    "answers a foreign customer like a missing one, privately",
    async (route, method) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      mocks.authenticateReader.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      const response = await route(request(method), context);
      expect(response.status).toBe(H.NotFound);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        "private, no-store",
      );
    },
  );

  it.each(writeRoutes)(
    "closes every write route to readers without a membership",
    async (route, method) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      await route(request(method, { displayName: "x" }), context);
      expect(mocks.createPortalFileUpload).not.toHaveBeenCalled();
      expect(mocks.createPortalFileLink).not.toHaveBeenCalled();
      expect(mocks.completePortalFileUpload).not.toHaveBeenCalled();
      expect(mocks.cancelPortalFileUpload).not.toHaveBeenCalled();
    },
  );

  it("lists one tab and rejects an unknown origin", async () => {
    mocks.listPortalFiles.mockResolvedValue({
      ok: true,
      value: { files: [], total: 0, page: 1, pageSize: 25 },
    });
    const ok = await list(
      request(HttpMethod.Get, undefined, "?origin=fromYou"),
      context,
    );
    expect(ok.status).toBe(H.Ok);
    expect(mocks.listPortalFiles).toHaveBeenCalledWith(ACTOR, {
      origin: PortalFileOrigin.FromYou,
      page: 1,
      pageSize: 25,
    });

    const invalid = await list(
      request(HttpMethod.Get, undefined, "?origin=internal"),
      context,
    );
    expect(invalid.status).toBe(H.UnprocessableContent);
  });

  it("refuses visibility and uploader fields from the customer", async () => {
    const response = await link(
      request(HttpMethod.Post, {
        displayName: "Link",
        url: "https://example.com",
        visibleToCustomer: false,
      }),
      context,
    );
    expect(response.status).toBe(H.UnprocessableContent);
    expect(mocks.createPortalFileLink).not.toHaveBeenCalled();

    const uploadResponse = await upload(
      request(HttpMethod.Post, {
        displayName: "logo.png",
        sizeBytes: 10,
        uploadedBySide: "internal",
      }),
      context,
    );
    expect(uploadResponse.status).toBe(H.UnprocessableContent);
    expect(mocks.createPortalFileUpload).not.toHaveBeenCalled();
  });

  it("creates a link through the verified actor", async () => {
    mocks.createPortalFileLink.mockResolvedValue({
      ok: true,
      value: { id: FILE_ID },
    });
    const response = await link(
      request(HttpMethod.Post, {
        displayName: "Brand film",
        url: "https://drive.google.com/file/1",
      }),
      context,
    );
    expect(response.status).toBe(H.Created);
    expect(mocks.createPortalFileLink).toHaveBeenCalledWith(ACTOR, {
      displayName: "Brand film",
      url: "https://drive.google.com/file/1",
    });
  });

  it("answers 404 for a guessed file id", async () => {
    mocks.getPortalFileDownloadUrl.mockResolvedValue({
      ok: false,
      code: FileApiErrorCode.NotFound,
    });
    const response = await downloadUrl(request(HttpMethod.Get), context);
    expect(response.status).toBe(H.NotFound);
  });

  it("cancels only through the authenticated portal actor", async () => {
    mocks.cancelPortalFileUpload.mockResolvedValue({
      ok: true,
      value: { cancelled: true },
    });
    const response = await cancel(request(HttpMethod.Post), context);
    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual({ cancelled: true });
    expect(mocks.cancelPortalFileUpload).toHaveBeenCalledWith(ACTOR, FILE_ID);
  });

  it("streams downloads sandboxed and never cached", async () => {
    mocks.downloadPortalFile.mockResolvedValue({
      ok: true,
      value: {
        filename: "Übersicht.txt",
        contentType: "text/plain; charset=utf-8",
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("hello"));
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
      "%C3%9Cbersicht.txt",
    );
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
    expect(await response.text()).toBe("hello");
  });

  it("rejects a malformed archive selection before any query", async () => {
    const response = await archive(
      request(HttpMethod.Post, { fileIds: [FILE_ID, FILE_ID] }),
      context,
    );
    expect(response.status).toBe(H.UnprocessableContent);
    expect(mocks.createPortalFilesArchive).not.toHaveBeenCalled();
  });
});
