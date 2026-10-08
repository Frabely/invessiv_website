import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  GET as list,
  POST as create,
} from "@/app/api/portal/[customerId]/credentials/route";
import { PATCH as update } from "@/app/api/portal/[customerId]/credentials/[credentialId]/route";
import { POST as reveal } from "@/app/api/portal/[customerId]/credentials/[credentialId]/reveal/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authenticateReader: vi.fn(),
  listPortalCredentials: vi.fn(),
  createPortalCredential: vi.fn(),
  updatePortalCredential: vi.fn(),
  revealPortalCredential: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
    authenticateReader: mocks.authenticateReader,
  },
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-credentials.query-handler",
  () => ({ listPortalCredentials: mocks.listPortalCredentials }),
);
vi.mock(
  "@/server/portal/command-handler/create-portal-credential.command-handler",
  () => ({ createPortalCredential: mocks.createPortalCredential }),
);
vi.mock(
  "@/server/portal/command-handler/update-portal-credential.command-handler",
  () => ({ updatePortalCredential: mocks.updatePortalCredential }),
);
vi.mock(
  "@/server/portal/command-handler/reveal-portal-credential.command-handler",
  () => ({ revealPortalCredential: mocks.revealPortalCredential }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "99999999-9999-4999-8999-999999999999";
const CREDENTIAL_ID = "22222222-2222-4222-8222-222222222222";
const PRIVATE_NO_STORE = "private, no-store";
const SECRET = "plaintext-secret-marker";
const context = {
  params: Promise.resolve({
    customerId: CUSTOMER_ID,
    credentialId: CREDENTIAL_ID,
  }),
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalCredentialsRead,
    Permission.PortalCredentialsReveal,
    Permission.PortalCredentialsWrite,
  ]),
  projectPermissions: new Map(),
});

const createBody = {
  projectId: null,
  title: "Hosting",
  credentialType: CredentialType.Hosting,
  url: null,
  username: null,
  secret: SECRET,
  note: null,
};
const updateBody = { version: 1, title: "Renamed" };
const revealBody = {
  field: CredentialSecretField.Secret,
  intent: CredentialRevealIntent.Show,
};
const writeRoutes = [
  [create, HttpMethod.Post, createBody],
  [update, HttpMethod.Patch, updateBody],
  [reveal, HttpMethod.Post, revealBody],
] as const;
const routes = [[list, HttpMethod.Get, undefined], ...writeRoutes] as const;
const handlers = [
  mocks.listPortalCredentials,
  mocks.createPortalCredential,
  mocks.updatePortalCredential,
  mocks.revealPortalCredential,
];

function request(method: HttpMethod, body?: object | string) {
  return new NextRequest(
    `http://localhost/api/portal/${CUSTOMER_ID}/credentials`,
    {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
            body: typeof body === "string" ? body : JSON.stringify(body),
          }),
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

describe("portal credential routes", () => {
  it.each(routes)(
    "answers a foreign customer like a missing one, privately",
    async (route, method, body) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      mocks.authenticateReader.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });

      const response = await route(request(method, body), context);

      expect(response.status).toBe(H.NotFound);
      expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
        PRIVATE_NO_STORE,
      );
      for (const handler of handlers) expect(handler).not.toHaveBeenCalled();
    },
  );

  it.each(writeRoutes)(
    "closes reveal and every write to the owner's read-only view",
    async (route, method, body) => {
      // An owner view resolves as a reader only; the actor gate answers like for any non-contact.
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });

      const response = await route(request(method, body), context);

      expect(response.status).toBe(H.NotFound);
      expect(mocks.authenticateReader).not.toHaveBeenCalled();
      for (const handler of handlers) expect(handler).not.toHaveBeenCalled();
    },
  );

  it("lists through the reader gate and never caches the answer", async () => {
    const value = {
      credentials: [],
      projects: [],
      capabilities: { canWrite: true, canReveal: true },
      configured: true,
    };
    mocks.listPortalCredentials.mockResolvedValue({ ok: true, value });

    const response = await list(request(HttpMethod.Get), context);

    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual(value);
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(mocks.listPortalCredentials).toHaveBeenCalledWith(ACTOR);
    expect(mocks.authenticateRequest).not.toHaveBeenCalled();
  });

  it("answers a contact without the role like a missing page", async () => {
    mocks.listPortalCredentials.mockResolvedValue({
      ok: false,
      code: E.NotFound,
    });

    expect((await list(request(HttpMethod.Get), context)).status).toBe(
      H.NotFound,
    );
  });

  it("creates through the verified actor and never takes a company from the body", async () => {
    mocks.createPortalCredential.mockResolvedValue({
      ok: true,
      value: { created: true, credential: null },
    });

    const response = await create(
      request(HttpMethod.Post, createBody),
      context,
    );

    expect(response.status).toBe(H.Created);
    expect(await response.json()).toEqual({ created: true, credential: null });
    expect(mocks.createPortalCredential).toHaveBeenCalledWith(
      ACTOR,
      createBody,
    );

    for (const body of [
      { ...createBody, customerId: OTHER_CUSTOMER_ID },
      { ...createBody, visibleToCustomer: false },
      { ...createBody, createdBySide: "internal" },
      { ...createBody, secret: "" },
    ])
      expect(
        (await create(request(HttpMethod.Post, body), context)).status,
      ).toBe(H.UnprocessableContent);
    expect(mocks.createPortalCredential).toHaveBeenCalledOnce();
  });

  it("rejects project, release and a missing version on an update", async () => {
    mocks.updatePortalCredential.mockResolvedValue({
      ok: true,
      value: { updated: true, credential: null },
    });

    const ok = await update(request(HttpMethod.Patch, updateBody), context);
    expect(ok.status).toBe(H.Ok);
    expect(mocks.updatePortalCredential).toHaveBeenCalledWith(
      ACTOR,
      CREDENTIAL_ID,
      updateBody,
    );

    for (const body of [
      { ...updateBody, projectId: null },
      { ...updateBody, visibleToCustomer: false },
      { title: "Renamed" },
      { version: 1 },
    ])
      expect(
        (await update(request(HttpMethod.Patch, body), context)).status,
      ).toBe(H.UnprocessableContent);
    expect(
      (await update(request(HttpMethod.Patch, "{not json"), context)).status,
    ).toBe(H.BadRequest);
    expect(mocks.updatePortalCredential).toHaveBeenCalledOnce();
  });

  it("answers a reveal with the value and accepts exactly one field and intent", async () => {
    mocks.revealPortalCredential.mockResolvedValue({
      ok: true,
      value: { value: SECRET },
    });

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );

    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual({ value: SECRET });
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(mocks.revealPortalCredential).toHaveBeenCalledWith(
      ACTOR,
      CREDENTIAL_ID,
      revealBody,
    );

    for (const body of [
      { ...revealBody, field: "username" },
      { ...revealBody, fields: ["secret", "note"] },
      { field: CredentialSecretField.Secret },
    ])
      expect(
        (await reveal(request(HttpMethod.Post, body), context)).status,
      ).toBe(H.UnprocessableContent);
    expect(mocks.revealPortalCredential).toHaveBeenCalledOnce();
  });

  it("answers the rate limit with 429 and Retry-After, without a value", async () => {
    mocks.revealPortalCredential.mockResolvedValue({
      ok: false,
      code: E.RateLimited,
      retryAfterSeconds: 42,
    });

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );

    expect(response.status).toBe(H.TooManyRequests);
    expect(response.headers.get(HttpHeaderName.RetryAfter)).toBe("42");
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
  });

  it.each([
    [E.NotFound, H.NotFound],
    [E.Validation, H.UnprocessableContent],
    [E.NotConfigured, H.ServiceUnavailable],
    [E.Internal, H.InternalServerError],
  ] as const)("maps %s to its status", async (code, status) => {
    mocks.createPortalCredential.mockResolvedValue({ ok: false, code });

    const response = await create(
      request(HttpMethod.Post, createBody),
      context,
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });

  it("answers a stale version with 409 and the portal view of the entry", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: null,
    };
    mocks.updatePortalCredential.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const response = await update(
      request(HttpMethod.Patch, updateBody),
      context,
    );

    expect(response.status).toBe(H.Conflict);
    expect(await response.json()).toEqual(conflict);
  });

  it("turns a thrown error into a private 500 without leaking it", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.revealPortalCredential.mockRejectedValue(
      new Error(`decrypt failed for ${SECRET}`),
    );

    const response = await reveal(
      request(HttpMethod.Post, revealBody),
      context,
    );

    expect(response.status).toBe(H.InternalServerError);
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      PRIVATE_NO_STORE,
    );
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(SECRET);
    consoleError.mockRestore();
  });
});
