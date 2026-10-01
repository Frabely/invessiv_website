import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import { PUT as answers } from "@/app/api/portal/[customerId]/onboarding/[formId]/answers/route";
import { GET as form } from "@/app/api/portal/[customerId]/onboarding/[formId]/route";
import { POST as submit } from "@/app/api/portal/[customerId]/onboarding/[formId]/submit/route";
import { GET as list } from "@/app/api/portal/[customerId]/onboarding/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authenticateReader: vi.fn(),
  listPortalOnboardingForms: vi.fn(),
  getPortalOnboardingForm: vi.fn(),
  savePortalOnboardingAnswer: vi.fn(),
  submitPortalOnboarding: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
    authenticateReader: mocks.authenticateReader,
  },
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-onboarding-forms.query-handler",
  () => ({ listPortalOnboardingForms: mocks.listPortalOnboardingForms }),
);
vi.mock(
  "@/server/portal/query-handler/get-portal-onboarding-form.query-handler",
  () => ({ getPortalOnboardingForm: mocks.getPortalOnboardingForm }),
);
vi.mock(
  "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler",
  () => ({ savePortalOnboardingAnswer: mocks.savePortalOnboardingAnswer }),
);
vi.mock(
  "@/server/portal/command-handler/submit-portal-onboarding.command-handler",
  () => ({ submitPortalOnboarding: mocks.submitPortalOnboarding }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FORM_ID = "22222222-2222-4222-8222-222222222222";
const FIELD_ID = "33333333-3333-4333-8333-333333333333";
const context = {
  params: Promise.resolve({ customerId: CUSTOMER_ID, formId: FORM_ID }),
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalOnboardingRead,
    Permission.PortalOnboardingSubmit,
  ]),
  projectPermissions: new Map(),
});
const ANSWER = { fieldId: FIELD_ID, groupEntryId: null, values: ["Acme"] };

const readRoutes = [list, form] as const;
const writeRoutes = [
  [answers, HttpMethod.Put],
  [submit, HttpMethod.Post],
] as const;

function request(method: HttpMethod, body?: object | string, query = "") {
  return new NextRequest(`http://localhost/api/portal/${CUSTOMER_ID}${query}`, {
    method,
    ...(body !== undefined
      ? {
          headers: { [HttpHeaderName.ContentType]: MediaType.Json },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }
      : {}),
  });
}

function expectPrivate(response: Response) {
  expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
    "private, no-store",
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

describe("portal onboarding routes", () => {
  it.each([
    ...readRoutes.map((route) => [route, HttpMethod.Get] as const),
    ...writeRoutes,
  ])(
    "answers a foreign customer like a missing one, privately",
    async (route, method) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      mocks.authenticateReader.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      const response = await route(
        request(method, method === HttpMethod.Get ? undefined : ANSWER),
        context,
      );
      expect(response.status).toBe(H.NotFound);
      expectPrivate(response);
      for (const handler of [
        mocks.listPortalOnboardingForms,
        mocks.getPortalOnboardingForm,
        mocks.savePortalOnboardingAnswer,
        mocks.submitPortalOnboarding,
      ])
        expect(handler).not.toHaveBeenCalled();
    },
  );

  it("lists the forms of the reader's company", async () => {
    mocks.listPortalOnboardingForms.mockResolvedValue([{ id: FORM_ID }]);
    const response = await list(request(HttpMethod.Get), context);
    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual([{ id: FORM_ID }]);
    expect(mocks.listPortalOnboardingForms).toHaveBeenCalledWith(ACTOR);
    expectPrivate(response);
  });

  it("reads a form in the requested locale and hides a missing one", async () => {
    mocks.getPortalOnboardingForm.mockResolvedValue(null);
    const response = await form(
      request(
        HttpMethod.Get,
        undefined,
        `?${PortalOnboardingQueryParam.Locale}=${Locale.En}`,
      ),
      context,
    );
    expect(response.status).toBe(H.NotFound);
    expect(await response.json()).toMatchObject({ code: E.NotFound });
    expect(mocks.getPortalOnboardingForm).toHaveBeenCalledWith(
      ACTOR,
      FORM_ID,
      Locale.En,
    );
  });

  it("falls back to the default locale for an unknown one", async () => {
    mocks.getPortalOnboardingForm.mockResolvedValue({ id: FORM_ID });
    const response = await form(
      request(
        HttpMethod.Get,
        undefined,
        `?${PortalOnboardingQueryParam.Locale}=xx`,
      ),
      context,
    );
    expect(response.status).toBe(H.Ok);
    expect(mocks.getPortalOnboardingForm).toHaveBeenCalledWith(
      ACTOR,
      FORM_ID,
      Locale.De,
    );
  });

  it("saves an answer and returns who saved when", async () => {
    const saved = { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" };
    mocks.savePortalOnboardingAnswer.mockResolvedValue({
      ok: true,
      value: saved,
    });
    const response = await answers(request(HttpMethod.Put, ANSWER), context);
    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual(saved);
    expect(mocks.savePortalOnboardingAnswer).toHaveBeenCalledWith(
      ACTOR,
      FORM_ID,
      ANSWER,
    );
    expectPrivate(response);
  });

  it("rejects a body that is not JSON without reaching the command", async () => {
    const response = await answers(request(HttpMethod.Put, "{"), context);
    expect(response.status).toBe(H.UnprocessableContent);
    expect(await response.json()).toMatchObject({ code: E.Validation });
    expect(mocks.savePortalOnboardingAnswer).not.toHaveBeenCalled();
  });

  it.each([
    [E.NotFound, H.NotFound],
    [E.Locked, H.Conflict],
    [E.Validation, H.UnprocessableContent],
  ])("maps %s of a save to %i", async (code, status) => {
    mocks.savePortalOnboardingAnswer.mockResolvedValue({ ok: false, code });
    const response = await answers(request(HttpMethod.Put, ANSWER), context);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });

  it("names the missing fields when a submission is refused", async () => {
    const missing = [{ blockId: "b", fieldId: FIELD_ID, groupEntryId: null }];
    mocks.submitPortalOnboarding.mockResolvedValue({
      ok: false,
      code: E.RequiredMissing,
      missing,
    });
    const response = await submit(request(HttpMethod.Post), context);
    expect(response.status).toBe(H.UnprocessableContent);
    expect(await response.json()).toMatchObject({
      code: E.RequiredMissing,
      missing,
    });
    expect(mocks.submitPortalOnboarding).toHaveBeenCalledWith(ACTOR, FORM_ID);
    expectPrivate(response);
  });

  it("answers 503 without details when a command throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.submitPortalOnboarding.mockRejectedValue(new Error("db down"));
    const response = await submit(request(HttpMethod.Post), context);
    expect(response.status).toBe(H.ServiceUnavailable);
    expect(await response.json()).toMatchObject({ code: E.Unavailable });
    expectPrivate(response);
  });
});
