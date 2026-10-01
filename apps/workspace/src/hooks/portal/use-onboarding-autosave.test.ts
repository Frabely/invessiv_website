// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import { DraftSaveState } from "@/common/constants/shared/draft-save-states";
import {
  portalOnboardingAnswer,
  portalOnboardingBlock,
  portalOnboardingChoices,
  portalOnboardingField,
  portalOnboardingForm,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import { useOnboardingAutosave } from "./use-onboarding-autosave";

const mocks = vi.hoisted(() => ({ saveAnswer: vi.fn() }));

vi.mock("@/client/portal/portal-onboarding-api-service", () => ({
  portalOnboardingApiService: { saveAnswer: mocks.saveAnswer },
}));

const SAVED = {
  ok: true,
  value: { savedAt: "2026-10-01T10:00:00.000Z", savedByName: "Ada" },
} as const;
const AUTOSAVE_MS = 1_500;

const form = portalOnboardingForm(
  [
    portalOnboardingBlock("block-1", [
      portalOnboardingField("name"),
      portalOnboardingField("mail", { type: T.Email }),
      portalOnboardingField("many", {
        type: T.MultiChoice,
        choices: portalOnboardingChoices("many", "a", "b"),
      }),
    ]),
  ],
  { answers: [portalOnboardingAnswer("name", { value: "Acme" })] },
);

function setup(onLockedAction = vi.fn()) {
  const rendered = renderHook(() =>
    useOnboardingAutosave({
      customerId: "customer-1",
      form,
      leaveWarning: "Leave?",
      onLockedAction,
    }),
  );
  return { ...rendered, onLockedAction };
}

/** Lets the pending promise chain of a save settle. */
async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("useOnboardingAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.saveAnswer.mockReset();
    mocks.saveAnswer.mockResolvedValue(SAVED);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts with the stored answers and nothing to save", () => {
    const { result } = setup();

    expect(result.current.drafts.get("name")).toEqual(["Acme"]);
    expect(result.current.saveState).toBe(DraftSaveState.Idle);
    expect(result.current.answers).toEqual(form.answers);
  });

  it("saves typed text once, debounced, with the last value", async () => {
    const { result } = setup();

    act(() => result.current.change("name", ["Acme G"]));
    act(() => result.current.change("name", ["Acme GmbH"]));
    expect(result.current.saveState).toBe(DraftSaveState.Unsaved);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 1);
    });
    expect(mocks.saveAnswer).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(mocks.saveAnswer).toHaveBeenCalledExactlyOnceWith(
      "customer-1",
      "form-1",
      { fieldId: "name", groupEntryId: null, values: ["Acme GmbH"] },
    );
    expect(result.current.saveState).toBe(DraftSaveState.Saved);
    expect(result.current.savedAt).toBe(SAVED.value.savedAt);
    expect(result.current.savedByName).toBe("Ada");
  });

  it("saves at once when the field is left", async () => {
    const { result } = setup();

    act(() => result.current.change("name", ["Acme GmbH"]));
    act(() => result.current.commit("name"));
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledOnce();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    });
    expect(mocks.saveAnswer).toHaveBeenCalledOnce();
  });

  it("does not save a field that was left untouched", async () => {
    const { result } = setup();

    act(() => result.current.commit("name"));
    await settle();

    expect(mocks.saveAnswer).not.toHaveBeenCalled();
  });

  it("saves a selection at once and counts it as an answer right away", async () => {
    const { result } = setup();

    act(() =>
      result.current.change("many", ["many-b", "many-a"], { immediate: true }),
    );
    expect(result.current.answers).toContainEqual(
      portalOnboardingAnswer("many", { choiceId: "many-a" }, 1),
    );
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledExactlyOnceWith(
      "customer-1",
      "form-1",
      { fieldId: "many", groupEntryId: null, choiceIds: ["many-b", "many-a"] },
    );
  });

  it("keeps invalid text in the field, names the error and never sends it", async () => {
    const { result } = setup();

    act(() => result.current.change("mail", ["nope"]));
    act(() => result.current.commit("mail"));
    await settle();

    expect(mocks.saveAnswer).not.toHaveBeenCalled();
    expect(result.current.drafts.get("mail")).toEqual(["nope"]);
    expect(result.current.invalid.get("mail")).toBe(
      QuestionnaireValueErrorCode.InvalidEmail,
    );
    expect(result.current.saveState).toBe(DraftSaveState.Unsaved);
    let flushed = true;
    await act(async () => {
      flushed = await result.current.flush();
    });
    expect(flushed).toBe(false);
  });

  it("keeps the input after a failed save and saves it on retry", async () => {
    mocks.saveAnswer.mockResolvedValueOnce({ ok: false, code: E.Unavailable });
    const { result } = setup();

    act(() => result.current.change("name", ["Acme GmbH"]));
    act(() => result.current.commit("name"));
    await settle();

    expect(result.current.saveState).toBe(DraftSaveState.Failed);
    expect(result.current.errorCode).toBe(E.Unavailable);
    expect(result.current.drafts.get("name")).toEqual(["Acme GmbH"]);

    act(() => result.current.retry());
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledTimes(2);
    expect(result.current.saveState).toBe(DraftSaveState.Saved);
    expect(result.current.errorCode).toBeNull();
  });

  it("flushes pending edits and resolves once every save is through", async () => {
    let finish!: (value: typeof SAVED) => void;
    mocks.saveAnswer.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = setup();
    act(() => result.current.change("name", ["Acme GmbH"]));
    act(() => result.current.change("many", ["many-a"]));

    let flushed: boolean | null = null;
    act(() => {
      void result.current.flush().then((value) => {
        flushed = value;
      });
    });
    await settle();
    expect(result.current.saveState).toBe(DraftSaveState.Saving);
    expect(flushed).toBeNull();

    finish(SAVED);
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledTimes(2);
    expect(flushed).toBe(true);
  });

  it("resolves a flush false when a save fails", async () => {
    mocks.saveAnswer.mockResolvedValue({ ok: false, code: E.Unavailable });
    const { result } = setup();
    act(() => result.current.change("name", ["Acme GmbH"]));

    let flushed = true;
    await act(async () => {
      flushed = await result.current.flush();
    });

    expect(flushed).toBe(false);
  });

  it("sends an edit made during a running save afterwards, in order", async () => {
    let finish!: (value: typeof SAVED) => void;
    mocks.saveAnswer.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = setup();
    act(() => result.current.change("name", ["A"]));
    act(() => result.current.commit("name"));
    await settle();

    act(() => result.current.change("name", ["AB"]));
    act(() => result.current.commit("name"));
    await settle();
    expect(mocks.saveAnswer).toHaveBeenCalledOnce();

    finish(SAVED);
    await settle();

    expect(mocks.saveAnswer).toHaveBeenCalledTimes(2);
    expect(mocks.saveAnswer.mock.calls[1][2]).toMatchObject({ values: ["AB"] });
    expect(result.current.saveState).toBe(DraftSaveState.Saved);
  });

  it.each([E.Locked, E.NotFound])(
    "hands a form that is %s back to the page",
    async (code) => {
      mocks.saveAnswer.mockResolvedValue({ ok: false, code });
      const { result, onLockedAction } = setup();

      act(() => result.current.change("name", ["Acme GmbH"]));
      act(() => result.current.commit("name"));
      await settle();

      expect(onLockedAction).toHaveBeenCalledOnce();
    },
  );
});
