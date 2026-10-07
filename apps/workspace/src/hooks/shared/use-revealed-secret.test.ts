// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { useRevealedSecret } from "./use-revealed-secret";

const SECRET = "plaintext-secret";
const CLIPBOARD_FAILED = "clipboard failed";

function setup(
  reveal = vi.fn<
    (intent: CredentialRevealIntent) => Promise<CredentialRevealOutcome>
  >(async () => ({ ok: true, value: SECRET })),
) {
  const rendered = renderHook(() =>
    useRevealedSecret({
      autoHideSeconds: 30,
      clipboardFailedMessage: CLIPBOARD_FAILED,
      reveal,
    }),
  );
  return { ...rendered, reveal };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  setVisibility("visible");
  vi.useRealTimers();
});

describe("useRevealedSecret", () => {
  it("discards an unedited reveal on conflict", async () => {
    const { result } = setup();
    await act(() => result.current.show());
    act(() => result.current.discardUnedited());
    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
    expect(result.current.value).toBeNull();
  });

  it("invalidates an in-flight reveal on conflict", async () => {
    let answer!: (outcome: CredentialRevealOutcome) => void;
    const { result } = setup(
      vi.fn(
        () =>
          new Promise<CredentialRevealOutcome>((resolve) => {
            answer = resolve;
          }),
      ),
    );
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.show();
    });
    act(() => result.current.discardUnedited());
    await act(async () => {
      answer({ ok: true, value: SECRET });
      await pending;
    });
    expect(result.current.value).toBeNull();
    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
  });

  it("still drops a preserved edit when the tab goes to the background", async () => {
    const { result } = setup();
    await act(() => result.current.show());
    act(() => result.current.edit("edited"));
    act(() => result.current.discardUnedited());
    expect(result.current.value).toBe("edited");
    act(() => setVisibility("hidden"));
    act(() => result.current.discardUnedited());
    expect(result.current.value).toBeNull();
  });

  it.each(["timeout", "background"])(
    "drops edited disclosed values on %s",
    async (reason) => {
      const { result } = setup();
      await act(() => result.current.show());
      act(() => vi.advanceTimersByTime(20_000));
      act(() => result.current.edit(`${SECRET}-edited`));
      expect(result.current.edited).toBe(true);
      expect(result.current.secondsLeft).toBe(10);
      act(() => {
        if (reason === "timeout") vi.advanceTimersByTime(10_000);
        else setVisibility("hidden");
      });
      expect(result.current.value).toBeNull();
      expect(result.current.edited).toBe(false);
    },
  );
  it("starts hidden without requesting anything", () => {
    const { result, reveal } = setup();

    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
    expect(result.current.value).toBeNull();
    expect(reveal).not.toHaveBeenCalled();
  });

  it("shows the value with the show intent and counts down", async () => {
    const { result, reveal } = setup();

    await act(() => result.current.show());

    expect(reveal).toHaveBeenCalledExactlyOnceWith(CredentialRevealIntent.Show);
    expect(result.current).toMatchObject({
      status: RevealedSecretStatus.Visible,
      value: SECRET,
      secondsLeft: 30,
    });

    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.secondsLeft).toBe(20);
    expect(result.current.value).toBe(SECRET);
  });

  it("drops the value after the countdown", async () => {
    const { result } = setup();
    await act(() => result.current.show());

    act(() => vi.advanceTimersByTime(29_000));
    expect(result.current.value).toBe(SECRET);
    act(() => vi.advanceTimersByTime(1_000));

    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
    expect(result.current.value).toBeNull();
  });

  it("drops the value when the tab goes to the background", async () => {
    const { result } = setup();
    await act(() => result.current.show());

    act(() => setVisibility("hidden"));

    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
    expect(result.current.value).toBeNull();
  });

  it("hides on request and ignores an answer that arrives afterwards", async () => {
    let answer: (outcome: CredentialRevealOutcome) => void = () => undefined;
    const { result } = setup(
      vi.fn(
        () =>
          new Promise<CredentialRevealOutcome>((resolve) => {
            answer = resolve;
          }),
      ),
    );

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.show();
    });
    expect(result.current.status).toBe(RevealedSecretStatus.Loading);
    act(() => result.current.hide());
    await act(async () => {
      answer({ ok: true, value: SECRET });
      await pending;
    });

    expect(result.current.status).toBe(RevealedSecretStatus.Hidden);
    expect(result.current.value).toBeNull();
  });

  it("copies with the copy intent without keeping the value", async () => {
    const { result, reveal } = setup();

    await act(() => result.current.copy());

    expect(reveal).toHaveBeenCalledExactlyOnceWith(CredentialRevealIntent.Copy);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(SECRET);
    expect(result.current).toMatchObject({
      status: RevealedSecretStatus.Hidden,
      value: null,
      copied: true,
    });

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current.copied).toBe(false);
  });

  it("keeps a visible value visible while copying", async () => {
    const { result } = setup();
    await act(() => result.current.show());

    await act(() => result.current.copy());

    expect(result.current).toMatchObject({
      status: RevealedSecretStatus.Visible,
      value: SECRET,
      copied: true,
    });
  });

  it("reports a rejected request and a blocked clipboard", async () => {
    const { result } = setup(
      vi.fn(async () => ({ ok: false, message: "Too many reveals" }) as const),
    );

    await act(() => result.current.show());
    expect(result.current).toMatchObject({
      status: RevealedSecretStatus.Failed,
      value: null,
      message: "Too many reveals",
    });

    writeText.mockRejectedValue(new Error("denied"));
    const blocked = setup();
    await act(() => blocked.result.current.copy());
    expect(blocked.result.current).toMatchObject({
      status: RevealedSecretStatus.Failed,
      value: null,
      message: CLIPBOARD_FAILED,
      copied: false,
    });
  });
});
