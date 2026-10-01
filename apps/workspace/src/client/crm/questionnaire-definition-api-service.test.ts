import { afterEach, describe, expect, it, vi } from "vitest";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { questionnaireDefinitionApiService } from "@/client/crm/questionnaire-definition-api-service";
import {
  blockFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

const api = questionnaireDefinitionApiService.forEndpoints({
  block: (id) => `/owner/blocks/${id}`,
  blockFields: (id) => `/owner/blocks/${id}/fields`,
  field: (id) => `/owner/fields/${id}`,
  fieldMove: (id) => `/owner/fields/${id}/move`,
});

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("questionnaireDefinitionApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends each block editor write to the path of its owner", async () => {
    const block = blockFixture([fieldFixture("name")]);
    const fetchMock = respondWith(HttpResponseCode.Ok, block);
    const field = block.fields[0]!;

    await api.updateBlock(block.id, {
      key: block.key,
      carryOver: false,
      status: block.status,
      translations: {},
      version: 1,
    });
    await api.createField(block.id, {} as never);
    await api.updateField(field.id, {} as never);
    await api.deleteField(field.id, { expectedBlockVersion: 1 });
    await api.moveField(field.id, {
      direction: 1,
      expectedBlockVersion: 1,
    });

    expect(
      fetchMock.mock.calls.map(([url, init]) => [
        url,
        (init as RequestInit).method,
      ]),
    ).toEqual([
      [`/owner/blocks/${block.id}`, HttpMethod.Patch],
      [`/owner/blocks/${block.id}/fields`, HttpMethod.Post],
      [`/owner/fields/${field.id}`, HttpMethod.Patch],
      [`/owner/fields/${field.id}`, HttpMethod.Delete],
      [`/owner/fields/${field.id}/move`, HttpMethod.Post],
    ]);
  });

  it("hands back the whole block of the owner", async () => {
    const block = blockFixture([fieldFixture("name")]);
    respondWith(HttpResponseCode.Ok, block);

    expect(
      await api.deleteField(block.fields[0]!.id, { expectedBlockVersion: 1 }),
    ).toEqual({ ok: true, value: block });
  });

  it("answers a stale version with the current block", async () => {
    const current = blockFixture([], { version: 5 });
    respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 5,
      current,
    });

    expect(
      await api.moveField("f", { direction: 1, expectedBlockVersion: 1 }),
    ).toMatchObject({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
  });

  it("turns a code it does not know into a server error", async () => {
    respondWith(HttpResponseCode.Conflict, { error: "SOMETHING_ELSE" });

    expect(
      await api.deleteField("f", { expectedBlockVersion: 1 }),
    ).toMatchObject({ ok: false, code: QuestionnaireErrorCode.Internal });
  });

  it("translates the owner's own codes into the kit's, so the editor needs no branch", async () => {
    const owned = questionnaireDefinitionApiService.forEndpoints(
      {
        block: (id) => `/owner/blocks/${id}`,
        blockFields: (id) => `/owner/blocks/${id}/fields`,
        field: (id) => `/owner/fields/${id}`,
        fieldMove: (id) => `/owner/fields/${id}/move`,
      },
      { OWNER_LOCKED: QuestionnaireErrorCode.NotEditable },
    );
    respondWith(HttpResponseCode.Conflict, { error: "OWNER_LOCKED" });

    expect(await owned.deleteField("f-1", { expectedBlockVersion: 1 })).toEqual(
      { ok: false, code: QuestionnaireErrorCode.NotEditable },
    );
    expect(await api.deleteField("f-1", { expectedBlockVersion: 1 })).toEqual({
      ok: false,
      code: QuestionnaireErrorCode.Internal,
    });
  });
});
