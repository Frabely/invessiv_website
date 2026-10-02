import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingReleaseWarningKind } from "@invessiv/common/constants/crm/onboarding/onboarding-release-warning-kinds";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import * as blockFieldsRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/fields/route";
import * as blockMoveRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/move/route";
import * as blockReviewRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/review/route";
import * as blockRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/route";
import * as completeRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/complete/route";
import * as blocksRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/blocks/route";
import * as fieldMoveRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]/move/route";
import * as fieldRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]/route";
import * as fieldUsageRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]/usage/route";
import * as releaseRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/release/route";
import * as requestChangesRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/request-changes/route";
import * as formRoute from "@/app/api/workspace/crm/onboarding/forms/[formId]/route";
import * as projectOnboardingRoute from "@/app/api/workspace/crm/projects/[projectId]/onboarding/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
  workspaceActorWith,
} from "@/server/tests/support/workspace-auth-fixtures";
import { blockFixture } from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));

const ID = "0b000000-0000-4000-8000-000000000001";
const BLOCK_ID = "0b000000-0000-4000-8000-000000000002";
const FIELD_ID = "0b000000-0000-4000-8000-000000000003";
const BASE = "http://localhost/api/workspace/crm/onboarding/forms";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getProjectOnboarding: vi.fn(),
  getOnboardingForm: vi.fn(),
  getOnboardingFieldUsage: vi.fn(),
  startProjectOnboarding: vi.fn(),
  addOnboardingFormBlock: vi.fn(),
  removeOnboardingFormBlock: vi.fn(),
  moveOnboardingFormBlock: vi.fn(),
  updateOnboardingFormBlock: vi.fn(),
  createOnboardingFormField: vi.fn(),
  updateOnboardingFormField: vi.fn(),
  deleteOnboardingFormField: vi.fn(),
  moveOnboardingFormField: vi.fn(),
  releaseOnboardingForm: vi.fn(),
  reviewOnboardingBlock: vi.fn(),
  requestOnboardingChanges: vi.fn(),
  completeOnboardingForm: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler",
  () => ({ getProjectOnboarding: mocks.getProjectOnboarding }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler",
  () => ({ getOnboardingForm: mocks.getOnboardingForm }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-onboarding-field-usage.query-handler",
  () => ({ getOnboardingFieldUsage: mocks.getOnboardingFieldUsage }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler",
  () => ({ startProjectOnboarding: mocks.startProjectOnboarding }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/add-onboarding-form-block.command-handler",
  () => ({ addOnboardingFormBlock: mocks.addOnboardingFormBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/remove-onboarding-form-block.command-handler",
  () => ({ removeOnboardingFormBlock: mocks.removeOnboardingFormBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/move-onboarding-form-block.command-handler",
  () => ({ moveOnboardingFormBlock: mocks.moveOnboardingFormBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-onboarding-form-block.command-handler",
  () => ({ updateOnboardingFormBlock: mocks.updateOnboardingFormBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-onboarding-form-field.command-handler",
  () => ({ createOnboardingFormField: mocks.createOnboardingFormField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-onboarding-form-field.command-handler",
  () => ({ updateOnboardingFormField: mocks.updateOnboardingFormField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/delete-onboarding-form-field.command-handler",
  () => ({ deleteOnboardingFormField: mocks.deleteOnboardingFormField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/move-onboarding-form-field.command-handler",
  () => ({ moveOnboardingFormField: mocks.moveOnboardingFormField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/release-onboarding-form.command-handler",
  () => ({ releaseOnboardingForm: mocks.releaseOnboardingForm }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/review-onboarding-block.command-handler",
  () => ({ reviewOnboardingBlock: mocks.reviewOnboardingBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/request-onboarding-changes.command-handler",
  () => ({ requestOnboardingChanges: mocks.requestOnboardingChanges }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/complete-onboarding-form.command-handler",
  () => ({ completeOnboardingForm: mocks.completeOnboardingForm }),
);

type Call = (request: NextRequest) => Promise<Response>;

function request(url: string, method: HttpMethod, body?: string): NextRequest {
  return new Request(url, {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

const projectContext = { params: Promise.resolve({ projectId: ID }) };
const formContext = { params: Promise.resolve({ formId: ID }) };
const blockContext = {
  params: Promise.resolve({ formId: ID, blockId: BLOCK_ID }),
};
const fieldContext = {
  params: Promise.resolve({ formId: ID, fieldId: FIELD_ID }),
};

const READS: [string, Call, keyof typeof mocks][] = [
  [
    "GET project onboarding",
    (r) => projectOnboardingRoute.GET(r, projectContext),
    "getProjectOnboarding",
  ],
  ["GET form", (r) => formRoute.GET(r, formContext), "getOnboardingForm"],
  [
    "GET field usage",
    (r) => fieldUsageRoute.GET(r, fieldContext),
    "getOnboardingFieldUsage",
  ],
];

const WRITES: [string, Call, keyof typeof mocks, unknown[]][] = [
  [
    "POST project onboarding",
    (r) => projectOnboardingRoute.POST(r, projectContext),
    "startProjectOnboarding",
    [ID],
  ],
  [
    "POST blocks",
    (r) => blocksRoute.POST(r, formContext),
    "addOnboardingFormBlock",
    [ID],
  ],
  [
    "PATCH block",
    (r) => blockRoute.PATCH(r, blockContext),
    "updateOnboardingFormBlock",
    [ID, BLOCK_ID],
  ],
  [
    "DELETE block",
    (r) => blockRoute.DELETE(r, blockContext),
    "removeOnboardingFormBlock",
    [ID, BLOCK_ID],
  ],
  [
    "POST block move",
    (r) => blockMoveRoute.POST(r, blockContext),
    "moveOnboardingFormBlock",
    [ID, BLOCK_ID],
  ],
  [
    "POST fields",
    (r) => blockFieldsRoute.POST(r, blockContext),
    "createOnboardingFormField",
    [ID, BLOCK_ID],
  ],
  [
    "PATCH field",
    (r) => fieldRoute.PATCH(r, fieldContext),
    "updateOnboardingFormField",
    [ID, FIELD_ID],
  ],
  [
    "DELETE field",
    (r) => fieldRoute.DELETE(r, fieldContext),
    "deleteOnboardingFormField",
    [ID, FIELD_ID],
  ],
  [
    "POST field move",
    (r) => fieldMoveRoute.POST(r, fieldContext),
    "moveOnboardingFormField",
    [ID, FIELD_ID],
  ],
  [
    "POST release",
    (r) => releaseRoute.POST(r, formContext),
    "releaseOnboardingForm",
    [ID],
  ],
  [
    "PATCH block review",
    (r) => blockReviewRoute.PATCH(r, blockContext),
    "reviewOnboardingBlock",
    [ID, BLOCK_ID],
  ],
  [
    "POST request changes",
    (r) => requestChangesRoute.POST(r, formContext),
    "requestOnboardingChanges",
    [ID],
  ],
  [
    "POST complete",
    (r) => completeRoute.POST(r, formContext),
    "completeOnboardingForm",
    [ID],
  ],
];

const ALL: [string, Call, keyof typeof mocks][] = [
  ...READS,
  ...WRITES.map(([name, call, handler]): [string, Call, keyof typeof mocks] => [
    name,
    call,
    handler,
  ]),
];

describe("CRM onboarding form routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(ALL)("%s answers 401 without a session", async (_, call, handler) => {
    mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());
    const response = await call(request(BASE, HttpMethod.Post, "{}"));
    expect(response.status).toBe(HttpResponseCode.Unauthorized);
    expect(mocks[handler]).not.toHaveBeenCalled();
  });

  it.each(READS)(
    "%s answers 403 without projects.read",
    async (_, call, handler) => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.QuestionnaireTemplatesWrite]),
      );
      const response = await call(request(BASE, HttpMethod.Get));
      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it.each(WRITES)(
    "%s answers 403 with only projects.read",
    async (_, call, handler) => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.ProjectsRead]),
      );
      const response = await call(request(BASE, HttpMethod.Post, "{}"));
      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it.each(WRITES)(
    "%s admits a member whose projects.write is bound to one project",
    async (_, call, handler) => {
      mocks.authenticate.mockResolvedValue({
        ...authorizedWorkspaceRequest(),
        actor: {
          ...workspaceActorWith([]),
          projectPermissions: new Map([
            [
              ID,
              {
                customerId: ID,
                permissions: new Set([Permission.ProjectsWrite]),
              },
            ],
          ]),
        },
      });
      mocks[handler].mockResolvedValue({
        ok: false,
        code: OnboardingErrorCode.FormNotFound,
      });
      const response = await call(request(BASE, HttpMethod.Post, "{}"));
      // Admitted by the route; whether the form is in reach is the command's answer.
      expect(response.status).toBe(HttpResponseCode.NotFound);
    },
  );

  it.each(WRITES)(
    "%s answers 400 for a body that is no JSON",
    async (_, call, handler) => {
      const response = await call(request(BASE, HttpMethod.Post, "{"));
      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it.each(WRITES)(
    "%s passes its ids, the body and the actor to the command",
    async (_, call, handler, ids) => {
      mocks[handler].mockResolvedValue({ ok: true, value: {} });
      await call(request(BASE, HttpMethod.Post, '{"some":"body"}'));
      expect(mocks[handler]).toHaveBeenCalledWith(
        ...ids,
        { some: "body" },
        workspaceActorWith(),
      );
    },
  );

  it.each(READS)(
    "%s answers 404 for what is out of reach",
    async (_, call, handler) => {
      mocks[handler].mockResolvedValue(null);
      const response = await call(request(BASE, HttpMethod.Get));
      expect(response.status).toBe(HttpResponseCode.NotFound);
    },
  );

  it("returns the project state, the form and the usage without an envelope", async () => {
    const state = { projectId: ID, form: null, canStart: true };
    mocks.getProjectOnboarding.mockResolvedValue(state);
    mocks.getOnboardingForm.mockResolvedValue({ id: ID, blocks: [] });
    mocks.getOnboardingFieldUsage.mockResolvedValue({
      answers: 2,
      files: 1,
      entries: 0,
    });

    const project = await projectOnboardingRoute.GET(
      request(BASE, HttpMethod.Get),
      projectContext,
    );
    expect(project.status).toBe(HttpResponseCode.Ok);
    expect(await project.json()).toEqual(state);
    expect(mocks.getProjectOnboarding).toHaveBeenCalledWith(
      ID,
      workspaceActorWith(),
    );
    expect(
      await (
        await formRoute.GET(request(BASE, HttpMethod.Get), formContext)
      ).json(),
    ).toEqual({ id: ID, blocks: [] });
    expect(
      await (
        await fieldUsageRoute.GET(request(BASE, HttpMethod.Get), fieldContext)
      ).json(),
    ).toEqual({ answers: 2, files: 1, entries: 0 });
    expect(mocks.getOnboardingFieldUsage).toHaveBeenCalledWith(
      ID,
      FIELD_ID,
      workspaceActorWith(),
    );
  });

  it("answers a started form, an added block and a new field with 201", async () => {
    const form = { id: ID, version: 1, blocks: [] };
    mocks.startProjectOnboarding.mockResolvedValue({ ok: true, value: form });
    mocks.addOnboardingFormBlock.mockResolvedValue({ ok: true, value: form });
    mocks.createOnboardingFormField.mockResolvedValue({
      ok: true,
      value: blockFixture([]),
    });

    const started = await projectOnboardingRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      projectContext,
    );
    expect(started.status).toBe(HttpResponseCode.Created);
    expect(await started.json()).toEqual(form);
    expect(
      (
        await blocksRoute.POST(
          request(BASE, HttpMethod.Post, "{}"),
          formContext,
        )
      ).status,
    ).toBe(HttpResponseCode.Created);
    expect(
      (
        await blockFieldsRoute.POST(
          request(BASE, HttpMethod.Post, "{}"),
          blockContext,
        )
      ).status,
    ).toBe(HttpResponseCode.Created);
  });

  it("answers a version conflict with 409 and the current form", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current: { id: ID, version: 4, blocks: [] },
    };
    mocks.moveOnboardingFormBlock.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    const response = await blockMoveRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      blockContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toEqual(conflict);
  });

  it.each([
    [OnboardingErrorCode.FormNotFound, HttpResponseCode.NotFound],
    [OnboardingErrorCode.ProjectNotFound, HttpResponseCode.NotFound],
    [OnboardingErrorCode.ProjectNotEligible, HttpResponseCode.Conflict],
    [OnboardingErrorCode.FormExists, HttpResponseCode.Conflict],
    [OnboardingErrorCode.InvalidTransition, HttpResponseCode.Conflict],
    [OnboardingErrorCode.NotEditable, HttpResponseCode.Conflict],
    [
      OnboardingErrorCode.RequiredMissing,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      OnboardingErrorCode.ReviewIncomplete,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      OnboardingErrorCode.CallDateRequired,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      OnboardingErrorCode.FileNotAttachable,
      HttpResponseCode.UnprocessableContent,
    ],
    [QuestionnaireErrorCode.TemplateNotFound, HttpResponseCode.NotFound],
    [QuestionnaireErrorCode.BlockNotFound, HttpResponseCode.NotFound],
    [QuestionnaireErrorCode.KeyTaken, HttpResponseCode.Conflict],
    [
      QuestionnaireErrorCode.LimitReached,
      HttpResponseCode.UnprocessableContent,
    ],
  ])("maps %s to %i", async (code, status) => {
    mocks.addOnboardingFormBlock.mockResolvedValue({ ok: false, code });
    const response = await blocksRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: code });
  });

  it("answers a release that waits for an acknowledgement with 409 and its warnings", async () => {
    const warnings = [
      {
        kind: OnboardingReleaseWarningKind.MissingTranslation,
        blockId: BLOCK_ID,
        locale: "en",
      },
      { kind: OnboardingReleaseWarningKind.NoPortalAccess },
    ];
    mocks.releaseOnboardingForm.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.ReleaseWarnings,
      warnings,
    });
    const response = await releaseRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toMatchObject({
      error: OnboardingErrorCode.ReleaseWarnings,
      details: { warnings },
    });
  });

  it("answers a released form with 200 and the form", async () => {
    const form = { id: ID, version: 2, blocks: [] };
    mocks.releaseOnboardingForm.mockResolvedValue({ ok: true, value: form });
    const response = await releaseRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(await response.json()).toEqual(form);
  });

  it("answers a stale review with 409 and the current form", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: { id: ID, version: 7, blocks: [] },
    };
    mocks.reviewOnboardingBlock.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    const response = await blockReviewRoute.PATCH(
      request(BASE, HttpMethod.Patch, "{}"),
      blockContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toEqual(conflict);
  });

  it("answers a change request without a question for the customer with 422", async () => {
    mocks.requestOnboardingChanges.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.ReviewIncomplete,
    });
    const response = await requestChangesRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(await response.json()).toMatchObject({
      error: OnboardingErrorCode.ReviewIncomplete,
    });
  });

  it("answers a completion that lacks required answers with 422 and the fields", async () => {
    const missing = [
      { blockId: BLOCK_ID, fieldId: FIELD_ID, groupEntryId: null },
    ];
    mocks.completeOnboardingForm.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.RequiredMissing,
      missing,
    });
    const response = await completeRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(await response.json()).toMatchObject({
      error: OnboardingErrorCode.RequiredMissing,
      details: { missing },
    });
  });

  it("answers a completion without a call date with 422", async () => {
    mocks.completeOnboardingForm.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.CallDateRequired,
    });
    const response = await completeRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      formContext,
    );
    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(await response.json()).toMatchObject({
      error: OnboardingErrorCode.CallDateRequired,
    });
  });

  it("passes validation details through with 422", async () => {
    const errors = [{ code: "custom", path: ["templateId"], message: "bad" }];
    mocks.startProjectOnboarding.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.ValidationError,
      errors,
    });
    const response = await projectOnboardingRoute.POST(
      request(BASE, HttpMethod.Post, "{}"),
      projectContext,
    );
    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(await response.json()).toMatchObject({ details: errors });
  });

  it("answers 500 without details when a handler throws", async () => {
    mocks.removeOnboardingFormBlock.mockRejectedValue(new Error("boom"));
    const response = await blockRoute.DELETE(
      request(BASE, HttpMethod.Delete, "{}"),
      blockContext,
    );
    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    expect(await response.json()).toEqual({
      error: OnboardingErrorCode.Internal,
      message: "Unexpected server error",
    });
  });
});
