import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { CredentialQueryParam } from "@/common/constants/credentials/credential-query-params";
import { authenticateWorkspaceRequest } from "@/lib/auth/workspace-authentication";
import {
  GET as list,
  POST as create,
} from "@/app/api/workspace/crm/customers/[id]/credentials/route";
import {
  DELETE,
  PATCH,
} from "@/app/api/workspace/crm/credentials/[credentialId]/route";
import { PATCH as portalVisibility } from "@/app/api/workspace/crm/credentials/[credentialId]/portal-visibility/route";
import { POST as reveal } from "@/app/api/workspace/crm/credentials/[credentialId]/reveal/route";
import { createCredential } from "@/server/workspace/crm/command-handler/create-credential.command-handler";
import { deleteCredential } from "@/server/workspace/crm/command-handler/delete-credential.command-handler";
import { revealCredential } from "@/server/workspace/crm/command-handler/reveal-credential.command-handler";
import { setCredentialPortalVisibility } from "@/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler";
import { updateCredential } from "@/server/workspace/crm/command-handler/update-credential.command-handler";
import { listCustomerCredentials } from "@/server/workspace/crm/query-handler/list-customer-credentials.query-handler";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: vi.fn(),
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-customer-credentials.query-handler",
  () => ({ listCustomerCredentials: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-credential.command-handler",
  () => ({ createCredential: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-credential.command-handler",
  () => ({ updateCredential: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/delete-credential.command-handler",
  () => ({ deleteCredential: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler",
  () => ({ setCredentialPortalVisibility: vi.fn() }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/reveal-credential.command-handler",
  () => ({ revealCredential: vi.fn() }),
);

const id = "10101010-1010-4010-8010-101010101010";
const projectId = "20202020-2020-4020-8020-202020202020";
const context = { params: Promise.resolve({ id, credentialId: id }) };
const PRIVATE_NO_STORE = "private, no-store";
const SECRET = "plaintext-secret-marker";

const createBody = {
  projectId: null,
  title: "Hosting",
  credentialType: CredentialType.Hosting,
  url: null,
  username: null,
  secret: SECRET,
  note: null,
};
const revealBody = {
  field: CredentialSecretField.Secret,
  intent: CredentialRevealIntent.Show,
};
const visibilityBody = { version: 1, visibleToCustomer: true };
const dto: CredentialDto = {
  id,
  customerId: id,
  projectId: null,
  title: "Hosting",
  credentialType: CredentialType.Hosting,
  url: null,
  username: null,
  hasNote: false,
  visibleToCustomer: false,
  createdBySide: CredentialSide.Internal,
  secretChangedAt: "2026-10-01T08:00:00.000Z",
  lastRevealedAt: null,
  updatedAt: "2026-10-01T08:00:00.000Z",
  version: 2,
  capabilities: { canWrite: true, canReveal: true },
};

const routes = [
  [list, HttpMethod.Get, undefined],
  [create, HttpMethod.Post, createBody],
  [PATCH, HttpMethod.Patch, { version: 1, title: "Renamed" }],
  [DELETE, HttpMethod.Delete, { version: 1 }],
  [reveal, HttpMethod.Post, revealBody],
  [portalVisibility, HttpMethod.Patch, visibilityBody],
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

function request(method: HttpMethod, body?: object, query = "") {
  return new NextRequest(
    `http://localhost${WorkspaceApiEndpoint.CrmCredentials}/${id}${query}`,
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

describe("credential HTTP authorization", () => {
  it.each(routes)(
    "requires a workspace session for every endpoint",
    async (route, method, body) => {
      vi.mocked(authenticateWorkspaceRequest).mockResolvedValue({
        status: WorkspaceAuthStatus.Unauthenticated,
      });

      const response = await route(request(method, body), context);

      expect(response.status).toBe(H.Unauthorized);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        PRIVATE_NO_STORE,
      );
    },
  );

  it.each(routes)(
    "rejects a member without the endpoint permission before any handler runs",
    async (route, method, body) => {
      authorize([]);

      const response = await route(request(method, body), context);

      expect(response.status).toBe(H.Forbidden);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        PRIVATE_NO_STORE,
      );
      for (const handler of [
        listCustomerCredentials,
        createCredential,
        updateCredential,
        deleteCredential,
        revealCredential,
        setCredentialPortalVisibility,
      ])
        expect(vi.mocked(handler)).not.toHaveBeenCalled();
    },
  );

  it("does not let read or write permission reveal", async () => {
    authorize([Permission.CredentialsRead, Permission.CredentialsWrite]);

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );

    expect(response.status).toBe(H.Forbidden);
    expect(vi.mocked(revealCredential)).not.toHaveBeenCalled();
  });

  it("lets write permission create and update without reveal", async () => {
    authorize([Permission.CredentialsWrite]);
    vi.mocked(createCredential).mockResolvedValue({ ok: true, value: dto });
    vi.mocked(updateCredential).mockResolvedValue({ ok: true, value: dto });

    expect(
      (await create(request(HttpMethod.Post, createBody), context)).status,
    ).toBe(H.Created);
    expect(
      (
        await PATCH(
          request(HttpMethod.Patch, { version: 1, secret: SECRET }),
          context,
        )
      ).status,
    ).toBe(H.Ok);
  });
});

describe("credential HTTP request parsing", () => {
  it("rejects mass assignment, missing versions and malformed JSON", async () => {
    authorize([Permission.CredentialsWrite, Permission.CredentialsReveal]);

    // The origin of an entry is never part of an edit.
    expect(
      (
        await PATCH(
          request(HttpMethod.Patch, {
            version: 1,
            title: "Renamed",
            createdBySide: CredentialSide.Customer,
          }),
          context,
        )
      ).status,
    ).toBe(H.UnprocessableContent);
    expect(
      (
        await create(
          request(HttpMethod.Post, {
            ...createBody,
            createdBySide: CredentialSide.Customer,
          }),
          context,
        )
      ).status,
    ).toBe(H.UnprocessableContent);
    expect(
      (await PATCH(request(HttpMethod.Patch, { title: "No version" }), context))
        .status,
    ).toBe(H.UnprocessableContent);
    expect(
      (await PATCH(request(HttpMethod.Patch, { version: 1 }), context)).status,
    ).toBe(H.UnprocessableContent);
    expect((await DELETE(request(HttpMethod.Delete, {}), context)).status).toBe(
      H.UnprocessableContent,
    );
    expect((await create(request(HttpMethod.Post), context)).status).toBe(
      H.BadRequest,
    );
    expect(vi.mocked(createCredential)).not.toHaveBeenCalled();
    expect(vi.mocked(updateCredential)).not.toHaveBeenCalled();
    expect(vi.mocked(deleteCredential)).not.toHaveBeenCalled();
  });

  it("accepts exactly one known field and intent for a reveal", async () => {
    authorize([Permission.CredentialsReveal]);

    for (const body of [
      { field: "secret" },
      { field: "title", intent: CredentialRevealIntent.Show },
      { field: CredentialSecretField.Secret, intent: "export" },
      { field: ["secret", "note"], intent: CredentialRevealIntent.Show },
      { ...revealBody, fields: ["secret", "note"] },
    ])
      expect(
        (await reveal(request(HttpMethod.Post, body), context)).status,
      ).toBe(H.UnprocessableContent);
    expect(vi.mocked(revealCredential)).not.toHaveBeenCalled();
  });

  it("reads the project filter: missing, customer-wide and one project", async () => {
    authorize([Permission.CredentialsRead]);
    vi.mocked(listCustomerCredentials).mockResolvedValue({
      ok: true,
      value: { credentials: [] },
    });
    const filter = (value: string) =>
      `?${CredentialQueryParam.ProjectId}=${value}`;

    await list(request(HttpMethod.Get), context);
    await list(request(HttpMethod.Get, undefined, filter("null")), context);
    await list(request(HttpMethod.Get, undefined, filter(projectId)), context);

    expect(
      vi.mocked(listCustomerCredentials).mock.calls.map((call) => call[1]),
    ).toEqual([{ projectId: undefined }, { projectId: null }, { projectId }]);
  });
});

describe("credential HTTP responses", () => {
  it("answers a reveal with the value and never lets it be cached", async () => {
    authorize([Permission.CredentialsReveal]);
    vi.mocked(revealCredential).mockResolvedValue({
      ok: true,
      value: { value: SECRET },
    });

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );

    expect(response.status).toBe(H.Ok);
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(await response.json()).toEqual({ value: SECRET });
    expect(vi.mocked(revealCredential)).toHaveBeenCalledWith(
      id,
      revealBody,
      expect.objectContaining({ userId: id }),
    );
  });

  it("answers the rate limit with 429 and Retry-After, without a value", async () => {
    authorize([Permission.CredentialsReveal]);
    vi.mocked(revealCredential).mockResolvedValue({
      ok: false,
      code: E.RateLimited,
      retryAfterSeconds: 17,
    });

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );
    const body = await response.text();

    expect(response.status).toBe(H.TooManyRequests);
    expect(response.headers.get(HttpHeaderName.RetryAfter)).toBe("17");
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(JSON.parse(body)).toMatchObject({ code: E.RateLimited });
    expect(body).not.toContain("value");
  });

  it.each([
    [E.NotFound, H.NotFound],
    [E.Validation, H.UnprocessableContent],
    [E.NotConfigured, H.ServiceUnavailable],
    [E.Internal, H.InternalServerError],
  ] as const)("maps %s to its status", async (code, status) => {
    authorize([Permission.CredentialsWrite]);
    vi.mocked(updateCredential).mockResolvedValue({ ok: false, code });

    const response = await PATCH(
      request(HttpMethod.Patch, { version: 1, title: "Renamed" }),
      context,
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });

  it("accepts the release flag on create and nothing but a boolean for it", async () => {
    authorize([Permission.CredentialsWrite]);
    vi.mocked(createCredential).mockResolvedValue({ ok: true, value: dto });

    const released = await create(
      request(HttpMethod.Post, { ...createBody, visibleToCustomer: true }),
      context,
    );
    expect(released.status).toBe(H.Created);
    expect(vi.mocked(createCredential)).toHaveBeenCalledWith(
      id,
      { ...createBody, visibleToCustomer: true },
      expect.objectContaining({ userId: id }),
    );

    expect(
      (
        await create(
          request(HttpMethod.Post, { ...createBody, visibleToCustomer: "yes" }),
          context,
        )
      ).status,
    ).toBe(H.UnprocessableContent);
    expect(vi.mocked(createCredential)).toHaveBeenCalledOnce();
  });

  it("releases with the write permission and rejects anything but version and flag", async () => {
    authorize([Permission.CredentialsWrite]);
    vi.mocked(setCredentialPortalVisibility).mockResolvedValue({
      ok: true,
      value: { ...dto, visibleToCustomer: true },
    });

    const released = await portalVisibility(
      request(HttpMethod.Patch, visibilityBody),
      context,
    );
    expect(released.status).toBe(H.Ok);
    expect(vi.mocked(setCredentialPortalVisibility)).toHaveBeenCalledWith(
      id,
      visibilityBody,
      expect.objectContaining({ userId: id }),
    );

    for (const body of [
      { version: 1 },
      { visibleToCustomer: true },
      { ...visibilityBody, title: "Renamed" },
      { version: 1, visibleToCustomer: "yes" },
    ])
      expect(
        (await portalVisibility(request(HttpMethod.Patch, body), context))
          .status,
      ).toBe(H.UnprocessableContent);
    expect(vi.mocked(setCredentialPortalVisibility)).toHaveBeenCalledOnce();
  });

  it.each([E.CustomerOwned, E.ProjectHidden] as const)(
    "answers %s with 409 and its code, not with a version conflict",
    async (code) => {
      authorize([Permission.CredentialsWrite]);
      vi.mocked(setCredentialPortalVisibility).mockResolvedValue({
        ok: false,
        code,
      });

      const response = await portalVisibility(
        request(HttpMethod.Patch, visibilityBody),
        context,
      );

      expect(response.status).toBe(H.Conflict);
      expect(await response.json()).toMatchObject({ code });
    },
  );

  it("answers a stale version with 409 and the current metadata", async () => {
    authorize([Permission.CredentialsWrite]);
    vi.mocked(deleteCredential).mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 2,
        current: dto,
      },
    });

    const response = await DELETE(
      request(HttpMethod.Delete, { version: 1 }),
      context,
    );

    expect(response.status).toBe(H.Conflict);
    expect(await response.json()).toEqual({
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: dto,
    });
  });

  it("turns a thrown error into a private 500 without leaking it", async () => {
    authorize([Permission.CredentialsReveal]);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.mocked(revealCredential).mockRejectedValue(
      new Error(`database said: ${SECRET}`),
    );

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );
    const body = await response.text();

    expect(response.status).toBe(H.InternalServerError);
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(body).not.toContain(SECRET);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(SECRET);
  });
});
