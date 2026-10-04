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
import { DELETE as detachFile } from "@/app/api/portal/[customerId]/onboarding/[formId]/files/[answerFileId]/route";
import { POST as attachFile } from "@/app/api/portal/[customerId]/onboarding/[formId]/files/route";
import { POST as moveEntry } from "@/app/api/portal/[customerId]/onboarding/[formId]/group-entries/[entryId]/move/route";
import { DELETE as removeEntry } from "@/app/api/portal/[customerId]/onboarding/[formId]/group-entries/[entryId]/route";
import { POST as addEntry } from "@/app/api/portal/[customerId]/onboarding/[formId]/group-entries/route";
import { GET as form } from "@/app/api/portal/[customerId]/onboarding/[formId]/route";
import { POST as confirmServices } from "@/app/api/portal/[customerId]/onboarding/[formId]/services-confirmation/route";
import { POST as submit } from "@/app/api/portal/[customerId]/onboarding/[formId]/submit/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authenticateReader: vi.fn(),
  getPortalOnboardingForm: vi.fn(),
  savePortalOnboardingAnswer: vi.fn(),
  submitPortalOnboarding: vi.fn(),
  addPortalOnboardingGroupEntry: vi.fn(),
  removePortalOnboardingGroupEntry: vi.fn(),
  movePortalOnboardingGroupEntry: vi.fn(),
  attachPortalOnboardingFile: vi.fn(),
  detachPortalOnboardingFile: vi.fn(),
  confirmPortalOnboardingServices: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
    authenticateReader: mocks.authenticateReader,
  },
}));
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
vi.mock(
  "@/server/portal/command-handler/add-portal-onboarding-group-entry.command-handler",
  () => ({
    addPortalOnboardingGroupEntry: mocks.addPortalOnboardingGroupEntry,
  }),
);
vi.mock(
  "@/server/portal/command-handler/remove-portal-onboarding-group-entry.command-handler",
  () => ({
    removePortalOnboardingGroupEntry: mocks.removePortalOnboardingGroupEntry,
  }),
);
vi.mock(
  "@/server/portal/command-handler/move-portal-onboarding-group-entry.command-handler",
  () => ({
    movePortalOnboardingGroupEntry: mocks.movePortalOnboardingGroupEntry,
  }),
);
vi.mock(
  "@/server/portal/command-handler/attach-portal-onboarding-file.command-handler",
  () => ({ attachPortalOnboardingFile: mocks.attachPortalOnboardingFile }),
);
vi.mock(
  "@/server/portal/command-handler/detach-portal-onboarding-file.command-handler",
  () => ({ detachPortalOnboardingFile: mocks.detachPortalOnboardingFile }),
);
vi.mock(
  "@/server/portal/command-handler/confirm-portal-onboarding-services.command-handler",
  () => ({
    confirmPortalOnboardingServices: mocks.confirmPortalOnboardingServices,
  }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FORM_ID = "22222222-2222-4222-8222-222222222222";
const FIELD_ID = "33333333-3333-4333-8333-333333333333";
const ENTRY_ID = "44444444-4444-4444-8444-444444444444";
const ANSWER_FILE_ID = "55555555-5555-4555-8555-555555555555";
const FILE_ID = "66666666-6666-4666-8666-666666666666";
// Every route reads only its own segments, so one context serves them all.
const context = {
  params: Promise.resolve({
    customerId: CUSTOMER_ID,
    formId: FORM_ID,
    entryId: ENTRY_ID,
    answerFileId: ANSWER_FILE_ID,
  }),
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

const readRoutes = [form] as const;
const ENTRY = { id: ENTRY_ID, fieldId: FIELD_ID };
const ATTACHMENT = { fieldId: FIELD_ID, groupEntryId: null, fileId: FILE_ID };
const CONFIRMATION = { confirmed: true, note: null };
const SAVED = { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" };

const writeRoutes = [
  [answers, HttpMethod.Put],
  [submit, HttpMethod.Post],
  [addEntry, HttpMethod.Post],
  [removeEntry, HttpMethod.Delete],
  [moveEntry, HttpMethod.Post],
  [attachFile, HttpMethod.Post],
  [detachFile, HttpMethod.Delete],
  [confirmServices, HttpMethod.Post],
] as const;

/** The routes that carry a body, with the command each one hands it to. */
const bodyRoutes = [
  [addEntry, "addPortalOnboardingGroupEntry", ENTRY, [FORM_ID]],
  [
    moveEntry,
    "movePortalOnboardingGroupEntry",
    { direction: 1 },
    [{ formId: FORM_ID, entryId: ENTRY_ID }],
  ],
  [attachFile, "attachPortalOnboardingFile", ATTACHMENT, [FORM_ID]],
  [confirmServices, "confirmPortalOnboardingServices", CONFIRMATION, [FORM_ID]],
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
        mocks.getPortalOnboardingForm,
        mocks.savePortalOnboardingAnswer,
        mocks.submitPortalOnboarding,
        mocks.addPortalOnboardingGroupEntry,
        mocks.removePortalOnboardingGroupEntry,
        mocks.movePortalOnboardingGroupEntry,
        mocks.attachPortalOnboardingFile,
        mocks.detachPortalOnboardingFile,
        mocks.confirmPortalOnboardingServices,
      ])
        expect(handler).not.toHaveBeenCalled();
    },
  );

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

  it("lets a submit-only actor save without returning form details", async () => {
    const writer = createPortalActor({
      userId: ACTOR.userId,
      membershipId: ACTOR.membershipId,
      customerId: CUSTOMER_ID,
      personId: ACTOR.personId,
      firstName: null,
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalOnboardingSubmit,
      ]),
      projectPermissions: new Map(),
    });
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: writer,
    });
    mocks.savePortalOnboardingAnswer.mockResolvedValue({
      ok: true,
      value: SAVED,
    });

    const response = await answers(request(HttpMethod.Put, ANSWER), context);
    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual({ accepted: true });
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

  it.each(bodyRoutes)(
    "hands the target and the body to the command and answers with its value",
    async (route, handler, body, target) => {
      const value = { some: "value" };
      mocks[handler].mockResolvedValue({ ok: true, value });
      const response = await route(request(HttpMethod.Post, body), context);
      expect(response.status).toBe(H.Ok);
      expect(await response.json()).toEqual(value);
      expect(mocks[handler]).toHaveBeenCalledWith(ACTOR, ...target, body);
      expectPrivate(response);
    },
  );

  it.each(bodyRoutes)(
    "rejects a body that is not JSON without reaching the command",
    async (route, handler) => {
      const response = await route(request(HttpMethod.Post, "{"), context);
      expect(response.status).toBe(H.UnprocessableContent);
      expect(await response.json()).toMatchObject({ code: E.Validation });
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it("removes a group entry and detaches a file by their ids alone", async () => {
    mocks.removePortalOnboardingGroupEntry.mockResolvedValue({
      ok: true,
      value: [],
    });
    mocks.detachPortalOnboardingFile.mockResolvedValue({
      ok: true,
      value: SAVED,
    });

    const removed = await removeEntry(request(HttpMethod.Delete), context);
    expect(removed.status).toBe(H.Ok);
    expect(await removed.json()).toEqual([]);
    expect(mocks.removePortalOnboardingGroupEntry).toHaveBeenCalledWith(ACTOR, {
      formId: FORM_ID,
      entryId: ENTRY_ID,
    });

    const detached = await detachFile(request(HttpMethod.Delete), context);
    expect(detached.status).toBe(H.Ok);
    expect(await detached.json()).toEqual(SAVED);
    expect(mocks.detachPortalOnboardingFile).toHaveBeenCalledWith(ACTOR, {
      formId: FORM_ID,
      answerFileId: ANSWER_FILE_ID,
    });
    expectPrivate(detached);
  });

  it.each([
    [E.NotFound, H.NotFound],
    [E.Locked, H.Conflict],
    [E.Validation, H.UnprocessableContent],
    [E.LimitReached, H.UnprocessableContent],
    [E.NotAttachable, H.UnprocessableContent],
  ])("maps %s of an attachment to %i", async (code, status) => {
    mocks.attachPortalOnboardingFile.mockResolvedValue({ ok: false, code });
    const response = await attachFile(
      request(HttpMethod.Post, ATTACHMENT),
      context,
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
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
