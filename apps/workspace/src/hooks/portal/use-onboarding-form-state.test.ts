// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import {
  portalOnboardingBlock,
  portalOnboardingField,
  portalOnboardingForm,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import { useOnboardingFormState } from "./use-onboarding-form-state";

const mocks = vi.hoisted(() => ({
  addGroupEntry: vi.fn(),
  attachFile: vi.fn(),
}));

vi.mock("@/client/portal/portal-onboarding-api-service", () => ({
  portalOnboardingApiService: {
    addGroupEntry: mocks.addGroupEntry,
    attachFile: mocks.attachFile,
  },
}));

const form = portalOnboardingForm([
  portalOnboardingBlock("block-1", [
    portalOnboardingField("team", { type: T.Group }),
  ]),
]);

type Result<T> = { ok: true; value: T } | { ok: false; code: E };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function entry(id: string, position: number): QuestionnaireGroupEntryDto {
  return { id, fieldId: "team", position };
}

function setup() {
  return renderHook(() =>
    useOnboardingFormState({
      customerId: "customer-1",
      form,
      leaveWarning: "Leave?",
      onLockedAction: vi.fn(),
    }),
  );
}

/** Lets the pending promise chains settle. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useOnboardingFormState", () => {
  beforeEach(() => {
    mocks.addGroupEntry.mockReset();
    mocks.attachFile.mockReset();
  });

  afterEach(cleanup);

  it("keeps an entry that is still pending when an earlier add is answered", async () => {
    const first = deferred<Result<QuestionnaireGroupEntryDto[]>>();
    const second = deferred<Result<QuestionnaireGroupEntryDto[]>>();
    mocks.addGroupEntry
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = setup();

    let firstId = "";
    let secondId = "";
    act(() => {
      firstId = result.current.addEntry("team");
      secondId = result.current.addEntry("team");
    });
    expect(result.current.groupEntries).toHaveLength(2);

    first.resolve({ ok: true, value: [entry(firstId, 0)] });
    await flush();

    expect(result.current.groupEntries.map((e) => e.id)).toEqual([
      firstId,
      secondId,
    ]);

    second.resolve({
      ok: true,
      value: [entry(firstId, 0), entry(secondId, 1)],
    });
    await flush();

    expect(result.current.groupEntries.map((e) => e.id)).toEqual([
      firstId,
      secondId,
    ]);
  });

  it("drops a refused entry again", async () => {
    mocks.addGroupEntry.mockResolvedValue({
      ok: false,
      code: E.Locked,
    });
    const { result } = setup();

    act(() => {
      result.current.addEntry("team");
    });
    await flush();

    expect(result.current.groupEntries).toHaveLength(0);
  });

  it("waits for the entry before attaching a file to it", async () => {
    const added = deferred<Result<QuestionnaireGroupEntryDto[]>>();
    mocks.addGroupEntry.mockReturnValue(added.promise);
    mocks.attachFile.mockResolvedValue({ ok: true, value: { id: "link-1" } });
    const { result } = setup();

    let id = "";
    act(() => {
      id = result.current.addEntry("team");
    });
    let attached: Promise<unknown> = Promise.resolve();
    act(() => {
      attached = result.current.attachFile(
        { fieldId: "photos", groupEntryId: id },
        { id: "file-1" } as PortalFileDto,
      );
    });
    await flush();
    expect(mocks.attachFile).not.toHaveBeenCalled();

    added.resolve({ ok: true, value: [entry(id, 0)] });
    await act(async () => {
      await attached;
    });

    expect(mocks.attachFile).toHaveBeenCalledTimes(1);
  });

  it("does not attach a file to an entry the server refused", async () => {
    mocks.addGroupEntry.mockResolvedValue({ ok: false, code: E.Locked });
    const { result } = setup();

    let id = "";
    act(() => {
      id = result.current.addEntry("team");
    });
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.attachFile(
        { fieldId: "photos", groupEntryId: id },
        { id: "file-1" } as PortalFileDto,
      );
    });

    expect(outcome).toEqual({ ok: false, code: E.NotFound });
    expect(mocks.attachFile).not.toHaveBeenCalled();
  });
});
