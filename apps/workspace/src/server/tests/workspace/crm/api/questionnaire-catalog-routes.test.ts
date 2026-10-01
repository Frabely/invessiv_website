import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import * as blockDuplicateRoute from "@/app/api/workspace/crm/questionnaire/blocks/[blockId]/duplicate/route";
import * as blockFieldsRoute from "@/app/api/workspace/crm/questionnaire/blocks/[blockId]/fields/route";
import * as blockRoute from "@/app/api/workspace/crm/questionnaire/blocks/[blockId]/route";
import * as blocksRoute from "@/app/api/workspace/crm/questionnaire/blocks/route";
import * as fieldMoveRoute from "@/app/api/workspace/crm/questionnaire/fields/[fieldId]/move/route";
import * as fieldRoute from "@/app/api/workspace/crm/questionnaire/fields/[fieldId]/route";
import * as templateRoute from "@/app/api/workspace/crm/questionnaire/templates/[templateId]/route";
import * as templatesRoute from "@/app/api/workspace/crm/questionnaire/templates/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";
import { blockFixture } from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));

const ID = "0b000000-0000-4000-8000-000000000001";
const BASE = "http://localhost/api/workspace/crm/questionnaire";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listQuestionnaireBlocks: vi.fn(),
  getQuestionnaireBlock: vi.fn(),
  createQuestionnaireBlock: vi.fn(),
  updateQuestionnaireBlock: vi.fn(),
  deleteQuestionnaireBlock: vi.fn(),
  duplicateQuestionnaireBlock: vi.fn(),
  createQuestionnaireField: vi.fn(),
  updateQuestionnaireField: vi.fn(),
  deleteQuestionnaireField: vi.fn(),
  moveQuestionnaireField: vi.fn(),
  listQuestionnaireTemplates: vi.fn(),
  getQuestionnaireTemplate: vi.fn(),
  createQuestionnaireTemplate: vi.fn(),
  updateQuestionnaireTemplate: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-questionnaire-blocks.query-handler",
  () => ({ listQuestionnaireBlocks: mocks.listQuestionnaireBlocks }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-questionnaire-block.query-handler",
  () => ({ getQuestionnaireBlock: mocks.getQuestionnaireBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-questionnaire-block.command-handler",
  () => ({ createQuestionnaireBlock: mocks.createQuestionnaireBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-questionnaire-block.command-handler",
  () => ({ updateQuestionnaireBlock: mocks.updateQuestionnaireBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/delete-questionnaire-block.command-handler",
  () => ({ deleteQuestionnaireBlock: mocks.deleteQuestionnaireBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/duplicate-questionnaire-block.command-handler",
  () => ({ duplicateQuestionnaireBlock: mocks.duplicateQuestionnaireBlock }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-questionnaire-field.command-handler",
  () => ({ createQuestionnaireField: mocks.createQuestionnaireField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-questionnaire-field.command-handler",
  () => ({ updateQuestionnaireField: mocks.updateQuestionnaireField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/delete-questionnaire-field.command-handler",
  () => ({ deleteQuestionnaireField: mocks.deleteQuestionnaireField }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/move-questionnaire-field.command-handler",
  () => ({ moveQuestionnaireField: mocks.moveQuestionnaireField }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-questionnaire-templates.query-handler",
  () => ({ listQuestionnaireTemplates: mocks.listQuestionnaireTemplates }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-questionnaire-template.query-handler",
  () => ({ getQuestionnaireTemplate: mocks.getQuestionnaireTemplate }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-questionnaire-template.command-handler",
  () => ({ createQuestionnaireTemplate: mocks.createQuestionnaireTemplate }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-questionnaire-template.command-handler",
  () => ({ updateQuestionnaireTemplate: mocks.updateQuestionnaireTemplate }),
);

type Call = (request: NextRequest) => Promise<Response>;

function request(url: string, method: HttpMethod, body?: string): NextRequest {
  return new Request(url, {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

const blockContext = { params: Promise.resolve({ blockId: ID }) };
const fieldContext = { params: Promise.resolve({ fieldId: ID }) };
const templateContext = { params: Promise.resolve({ templateId: ID }) };

const READS: [string, Call][] = [
  ["GET blocks", (r) => blocksRoute.GET(r)],
  ["GET block", (r) => blockRoute.GET(r, blockContext)],
  ["GET templates", (r) => templatesRoute.GET(r)],
  ["GET template", (r) => templateRoute.GET(r, templateContext)],
];

const WRITES: [string, Call, keyof typeof mocks][] = [
  ["POST blocks", (r) => blocksRoute.POST(r), "createQuestionnaireBlock"],
  [
    "PATCH block",
    (r) => blockRoute.PATCH(r, blockContext),
    "updateQuestionnaireBlock",
  ],
  [
    "DELETE block",
    (r) => blockRoute.DELETE(r, blockContext),
    "deleteQuestionnaireBlock",
  ],
  [
    "POST duplicate",
    (r) => blockDuplicateRoute.POST(r, blockContext),
    "duplicateQuestionnaireBlock",
  ],
  [
    "POST fields",
    (r) => blockFieldsRoute.POST(r, blockContext),
    "createQuestionnaireField",
  ],
  [
    "PATCH field",
    (r) => fieldRoute.PATCH(r, fieldContext),
    "updateQuestionnaireField",
  ],
  [
    "DELETE field",
    (r) => fieldRoute.DELETE(r, fieldContext),
    "deleteQuestionnaireField",
  ],
  [
    "POST move",
    (r) => fieldMoveRoute.POST(r, fieldContext),
    "moveQuestionnaireField",
  ],
  [
    "POST templates",
    (r) => templatesRoute.POST(r),
    "createQuestionnaireTemplate",
  ],
  [
    "PATCH template",
    (r) => templateRoute.PATCH(r, templateContext),
    "updateQuestionnaireTemplate",
  ],
];

describe("CRM questionnaire catalog routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(READS)("%s answers 401 without a session", async (_, call) => {
    mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());
    const response = await call(request(`${BASE}/blocks`, HttpMethod.Get));
    expect(response.status).toBe(HttpResponseCode.Unauthorized);
  });

  it.each(READS)(
    "%s answers 403 without questionnaire_templates.read",
    async (_, call) => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.LineItemTemplatesRead]),
      );
      const response = await call(request(`${BASE}/blocks`, HttpMethod.Get));
      expect(response.status).toBe(HttpResponseCode.Forbidden);
    },
  );

  it.each(WRITES)(
    "%s answers 403 with only questionnaire_templates.read",
    async (_, call, handler) => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.QuestionnaireTemplatesRead]),
      );
      const response = await call(
        request(`${BASE}/blocks`, HttpMethod.Post, "{}"),
      );
      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it.each(WRITES)(
    "%s answers 400 for a body that is no JSON",
    async (_, call, handler) => {
      const response = await call(
        request(`${BASE}/blocks`, HttpMethod.Post, "{"),
      );
      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks[handler]).not.toHaveBeenCalled();
    },
  );

  it("forwards status and search of the list query", async () => {
    mocks.listQuestionnaireBlocks.mockResolvedValue({
      hasBlocks: true,
      rows: [],
    });
    const response = await blocksRoute.GET(
      request(
        `${BASE}/blocks?status=archived&q=%20team%20&tab=templates`,
        HttpMethod.Get,
      ),
    );
    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mocks.listQuestionnaireBlocks).toHaveBeenCalledWith({
      status: "archived",
      search: "team",
    });
  });

  it("answers 404 for an unknown block or template", async () => {
    mocks.getQuestionnaireBlock.mockResolvedValue(null);
    mocks.getQuestionnaireTemplate.mockResolvedValue(null);
    expect(
      (
        await blockRoute.GET(
          request(`${BASE}/blocks/${ID}`, HttpMethod.Get),
          blockContext,
        )
      ).status,
    ).toBe(HttpResponseCode.NotFound);
    expect(
      (
        await templateRoute.GET(
          request(`${BASE}/templates/${ID}`, HttpMethod.Get),
          templateContext,
        )
      ).status,
    ).toBe(HttpResponseCode.NotFound);
  });

  it("returns the created block with 201 and without an envelope", async () => {
    const block = blockFixture([]);
    mocks.createQuestionnaireBlock.mockResolvedValue({
      ok: true,
      value: block,
    });
    const response = await blocksRoute.POST(
      request(`${BASE}/blocks`, HttpMethod.Post, "{}"),
    );
    expect(response.status).toBe(HttpResponseCode.Created);
    expect(await response.json()).toEqual(block);
  });

  it("answers a version conflict with 409 and the current block", async () => {
    const current = blockFixture([], { version: 4 });
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current,
    };
    mocks.moveQuestionnaireField.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    const response = await fieldMoveRoute.POST(
      request(`${BASE}/fields/${ID}/move`, HttpMethod.Post, "{}"),
      fieldContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toEqual(conflict);
  });

  it.each([
    [QuestionnaireErrorCode.BlockInUse, HttpResponseCode.Conflict],
    [QuestionnaireErrorCode.KeyTaken, HttpResponseCode.Conflict],
    [QuestionnaireErrorCode.FieldNotFound, HttpResponseCode.NotFound],
    [
      QuestionnaireErrorCode.InvalidCondition,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      QuestionnaireErrorCode.InvalidFieldConfig,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      QuestionnaireErrorCode.TranslationRequired,
      HttpResponseCode.UnprocessableContent,
    ],
    [
      QuestionnaireErrorCode.LimitReached,
      HttpResponseCode.UnprocessableContent,
    ],
  ])("maps %s to %i", async (code, status) => {
    mocks.deleteQuestionnaireBlock.mockResolvedValue({ ok: false, code });
    const response = await blockRoute.DELETE(
      request(`${BASE}/blocks/${ID}`, HttpMethod.Delete, "{}"),
      blockContext,
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: code });
  });

  it("passes validation details through with 422", async () => {
    const errors = [{ code: "custom", path: ["key"], message: "bad" }];
    mocks.updateQuestionnaireField.mockResolvedValue({
      ok: false,
      code: QuestionnaireErrorCode.ValidationError,
      errors,
    });
    const response = await fieldRoute.PATCH(
      request(`${BASE}/fields/${ID}`, HttpMethod.Patch, "{}"),
      fieldContext,
    );
    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(await response.json()).toMatchObject({ details: errors });
  });

  it("answers 500 without details when a handler throws", async () => {
    mocks.updateQuestionnaireTemplate.mockRejectedValue(new Error("boom"));
    const response = await templateRoute.PATCH(
      request(`${BASE}/templates/${ID}`, HttpMethod.Patch, "{}"),
      templateContext,
    );
    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    expect(await response.json()).toEqual({
      error: QuestionnaireErrorCode.Internal,
      message: "Unexpected server error",
    });
  });
});
