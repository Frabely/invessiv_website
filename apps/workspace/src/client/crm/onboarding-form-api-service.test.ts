import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import { blockFixture } from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

const FORMS = "/api/workspace/crm/onboarding/forms";
const form = { id: "f-1", status: "draft", version: 2, blocks: [] };

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify(body), { status }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function calls(fetchMock: ReturnType<typeof respondWith>) {
  return fetchMock.mock.calls.map(([url, init]) => [
    url,
    (init as RequestInit).method,
    (init as RequestInit).body,
  ]);
}

describe("onboardingFormApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts a form below its project and hands back the form", async () => {
    const fetchMock = respondWith(HttpResponseCode.Created, form);

    expect(
      await onboardingFormApiService.start("p-1", { templateId: null }),
    ).toEqual({ ok: true, value: form });
    expect(calls(fetchMock)).toEqual([
      [
        "/api/workspace/crm/projects/p-1/onboarding",
        HttpMethod.Post,
        JSON.stringify({ templateId: null }),
      ],
    ]);
  });

  it("sends every block list command to the form's own path", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, form);

    await onboardingFormApiService.addBlock("f-1", {
      catalogBlockIds: ["c-1", "c-2"],
      expectedFormVersion: 2,
    });
    await onboardingFormApiService.moveBlock("f-1", "b-1", {
      direction: 1,
      expectedFormVersion: 2,
    });
    await onboardingFormApiService.removeBlock("f-1", "b-1", {
      expectedFormVersion: 2,
    });
    await onboardingFormApiService.getForm("f-1");
    await onboardingFormApiService.getFieldUsage("f-1", "q-1");

    expect(calls(fetchMock).map(([url, method]) => [url, method])).toEqual([
      [`${FORMS}/f-1/blocks`, HttpMethod.Post],
      [`${FORMS}/f-1/blocks/b-1/move`, HttpMethod.Post],
      [`${FORMS}/f-1/blocks/b-1`, HttpMethod.Delete],
      [`${FORMS}/f-1`, HttpMethod.Get],
      [`${FORMS}/f-1/fields/q-1/usage`, HttpMethod.Get],
    ]);
  });

  it("sends a review to the block and a change request to the form", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, form);
    const review = {
      reviewStatus: "clarification",
      clarificationMode: "customer",
      note: "Welche Domain?",
      expectedVersion: 3,
    } as const;

    expect(
      await onboardingFormApiService.reviewBlock("f-1", "b-1", review),
    ).toEqual({ ok: true, value: form });
    expect(
      await onboardingFormApiService.requestChanges("f-1", {
        expectedVersion: 2,
      }),
    ).toEqual({ ok: true, value: form });
    const completion = {
      expectedVersion: 2,
      callHeldOn: "2026-09-15",
      advancePhase: true,
    };
    expect(await onboardingFormApiService.complete("f-1", completion)).toEqual({
      ok: true,
      value: form,
    });

    expect(calls(fetchMock)).toEqual([
      [
        `${FORMS}/f-1/blocks/b-1/review`,
        HttpMethod.Patch,
        JSON.stringify(review),
      ],
      [
        `${FORMS}/f-1/request-changes`,
        HttpMethod.Post,
        JSON.stringify({ expectedVersion: 2 }),
      ],
      [`${FORMS}/f-1/complete`, HttpMethod.Post, JSON.stringify(completion)],
    ]);
  });

  it("hands back the current form of a version conflict", async () => {
    respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: form,
    });

    expect(
      await onboardingFormApiService.removeBlock("f-1", "b-1", {
        expectedFormVersion: 1,
      }),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: form,
    });
  });

  it("keeps form codes and kit codes of a refused block list command", async () => {
    respondWith(HttpResponseCode.Conflict, {
      error: OnboardingErrorCode.NotEditable,
    });
    expect(
      await onboardingFormApiService.addBlock("f-1", {
        catalogBlockIds: ["c-1"],
        expectedFormVersion: 2,
      }),
    ).toEqual({ ok: false, code: OnboardingErrorCode.NotEditable });

    respondWith(HttpResponseCode.Conflict, {
      error: QuestionnaireErrorCode.KeyTaken,
    });
    expect(
      await onboardingFormApiService.addBlock("f-1", {
        catalogBlockIds: ["c-1"],
        expectedFormVersion: 2,
      }),
    ).toEqual({ ok: false, code: QuestionnaireErrorCode.KeyTaken });
  });

  it("reads the usage of a field and rejects another shape", async () => {
    respondWith(HttpResponseCode.Ok, { answers: 3, files: 1, entries: 2 });
    expect(await onboardingFormApiService.getFieldUsage("f-1", "q-1")).toEqual({
      ok: true,
      value: { answers: 3, files: 1, entries: 2 },
    });

    respondWith(HttpResponseCode.Ok, { answers: "3" });
    expect(await onboardingFormApiService.getFieldUsage("f-1", "q-1")).toEqual({
      ok: false,
      code: OnboardingErrorCode.Internal,
    });
  });

  it("builds the block editor writes from the form's paths", async () => {
    const block = blockFixture([]);
    const fetchMock = respondWith(HttpResponseCode.Ok, block);
    const api = onboardingFormApiService.definitionApi("f-1");

    await api.createField(block.id, {} as never);
    await api.updateField("q-1", {} as never);
    await api.moveField("q-1", { direction: 1, expectedBlockVersion: 1 });
    await api.deleteField("q-1", { expectedBlockVersion: 1 });
    await api.updateBlock(block.id, {} as never);

    expect(calls(fetchMock).map(([url, method]) => [url, method])).toEqual([
      [`${FORMS}/f-1/blocks/${block.id}/fields`, HttpMethod.Post],
      [`${FORMS}/f-1/fields/q-1`, HttpMethod.Patch],
      [`${FORMS}/f-1/fields/q-1/move`, HttpMethod.Post],
      [`${FORMS}/f-1/fields/q-1`, HttpMethod.Delete],
      [`${FORMS}/f-1/blocks/${block.id}`, HttpMethod.Patch],
    ]);
  });

  it("tells the block editor in kit codes that the form is locked or gone", async () => {
    const api = onboardingFormApiService.definitionApi("f-1");

    respondWith(HttpResponseCode.Conflict, {
      error: OnboardingErrorCode.NotEditable,
    });
    expect(await api.deleteField("q-1", { expectedBlockVersion: 1 })).toEqual({
      ok: false,
      code: QuestionnaireErrorCode.NotEditable,
    });

    respondWith(HttpResponseCode.NotFound, {
      error: OnboardingErrorCode.FormNotFound,
    });
    expect(await api.deleteField("q-1", { expectedBlockVersion: 1 })).toEqual({
      ok: false,
      code: QuestionnaireErrorCode.BlockNotFound,
    });
  });
});

describe("onboardingFormApiService.release", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const request = { expectedVersion: 2, acknowledgeWarnings: false };
  const released = { ...form, status: "open", version: 3 };

  it("posts the release below the form and hands back the released form", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, released);

    expect(await onboardingFormApiService.release("f-1", request)).toEqual({
      ok: true,
      value: released,
    });
    expect(calls(fetchMock)).toEqual([
      [`${FORMS}/f-1/release`, HttpMethod.Post, JSON.stringify(request)],
    ]);
  });

  it("names the warnings a release waits for", async () => {
    const warnings = [
      { kind: "missing_translation", blockId: "b-1", locale: "en" },
      { kind: "no_portal_access" },
    ];
    respondWith(HttpResponseCode.Conflict, {
      error: OnboardingErrorCode.ReleaseWarnings,
      message: "warnings",
      details: { warnings: [...warnings, { kind: "unknown" }, "broken"] },
    });

    expect(await onboardingFormApiService.release("f-1", request)).toEqual({
      ok: false,
      code: OnboardingErrorCode.ReleaseWarnings,
      warnings,
    });
  });

  it("carries the current form of a version conflict", async () => {
    respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: released,
    });

    expect(await onboardingFormApiService.release("f-1", request)).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: released,
    });
  });

  it("reads the code of a refused release", async () => {
    respondWith(HttpResponseCode.UnprocessableContent, {
      error: QuestionnaireErrorCode.InvalidFieldConfig,
    });

    expect(await onboardingFormApiService.release("f-1", request)).toEqual({
      ok: false,
      code: QuestionnaireErrorCode.InvalidFieldConfig,
    });
  });

  it("treats a network failure as an internal error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await onboardingFormApiService.release("f-1", request)).toEqual({
      ok: false,
      code: OnboardingErrorCode.Internal,
    });
  });
});
